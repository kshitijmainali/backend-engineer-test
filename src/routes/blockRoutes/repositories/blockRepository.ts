import type { DatabaseClient } from '@/@types/fastify';
import {
  balanceDeltas,
  blocks,
  outputs,
  spentOutputs,
  transactions,
  type BalanceDeltaTableRow,
  type BlockTableRow,
  type OutputTableRow,
  type SpentOutputTableRow,
  type TransactionTableRow,
} from '@/db/schema';
import { eq, gt, inArray, max, sql } from 'drizzle-orm';
import type { InputRequestBody } from '../schema/postBlock';

interface IProcessedBlockData {
  block: Omit<BlockTableRow, 'createdAt'>;
  transactions: Omit<TransactionTableRow, 'createdAt'>[];
  outputs: Omit<OutputTableRow, 'id' | 'createdAt'>[];
  spentOutputs: Omit<SpentOutputTableRow, 'id' | 'createdAt'>[];
  balanceDeltas: Omit<BalanceDeltaTableRow, 'id' | 'createdAt'>[];
}

export class BlockRepository {
  constructor(private db: DatabaseClient) {}

  async saveBlock(blockData: IProcessedBlockData): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(blocks).values(blockData.block).execute();
      await tx.insert(transactions).values(blockData.transactions).execute();
      await tx.insert(outputs).values(blockData.outputs).execute();
      await tx.insert(spentOutputs).values(blockData.spentOutputs).execute();
      await tx.insert(balanceDeltas).values(blockData.balanceDeltas).execute();
    });
  }

  async getBlock(height: number): Promise<BlockTableRow | undefined> {
    const [block] = await this.db
      .select()
      .from(blocks)
      .where(eq(blocks.height, height))
      .limit(1);
    return block;
  }

  async getLatestBlock() {
    const [block] = await this.db
      .select({
        recentHeight: max(blocks.height),
      })
      .from(blocks)
      .limit(1);
    return block;
  }

  async getTransactionWithSameIds(transactionIds: string[]) {
    const existingTransactionWithSameIds = await this.db
      .select({
        txId: transactions.id,
      })
      .from(transactions)
      .where(inArray(transactions.id, transactionIds));

    return existingTransactionWithSameIds;
  }

  async getOutputsByTransactionAndIndex(inputItems: InputRequestBody[]) {
    const existingOutputKeys = inputItems.map(
      (input) => sql`(${input.txId}, ${input.index})`
    );
    const existingOutputs = await this.db
      .select()
      .from(outputs)
      .where(sql`(tx_id, index) IN (${sql.join(existingOutputKeys, sql`,`)})`);
    return existingOutputs;
  }

  async getSpentOutputsByTransactionAndIndex(inputItems: InputRequestBody[]) {
    const existingOutputKeys = inputItems.map(
      (input) => sql`(${input.txId}, ${input.index})`
    );
    const existingSpentOutputs = await this.db
      .select()
      .from(spentOutputs)
      .where(sql`(tx_id, index) IN (${sql.join(existingOutputKeys, sql`,`)})`);

    return existingSpentOutputs;
  }

  async rollbackBlock(height: number) {
    await this.db.delete(blocks).where(gt(blocks.height, height)).execute();
  }
}
export type { IProcessedBlockData };
