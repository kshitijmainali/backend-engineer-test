import type { DatabaseClient } from '@/@types/fastify';
import type {
  OutputTableRow,
  SpentOutputTableRow,
  TransactionTableRow,
} from '@/db/schema';
import { BlockRepository } from '../repositories/blockRepository';
import type { PostBlockBody } from '../schema/postBlock';
import BlockValidator from '../validators';
import { TransactionProcessor } from './transactionProcessor';

export class BlockService {
  private repository: BlockRepository;
  private validator: BlockValidator;
  private transactionProcessor: TransactionProcessor;

  constructor(private db: DatabaseClient) {
    this.repository = new BlockRepository(db);
    this.validator = new BlockValidator(this.repository);
    this.transactionProcessor = new TransactionProcessor();
  }

  async createBlock(blockData: PostBlockBody): Promise<void> {
    await this.validator.validateBlock(blockData);

    await this.validator.validateTransactionId(blockData.transactions);

    const transactionTableRows: Omit<TransactionTableRow, 'createdAt'>[] = [];
    const outputTableRows: Omit<OutputTableRow, 'id' | 'createdAt'>[] = [];
    const spentOutputTableRows: Omit<
      SpentOutputTableRow,
      'id' | 'createdAt'
    >[] = [];
    const balanceDeltas: Map<string, number> = new Map();

    for (const transaction of blockData.transactions) {
      const existingOutputsBalance =
        await this.validator.validateOutputBalance(transaction);

      await this.validator.validateIfTransactionAreSpent(transaction.inputs);

      const { currentOutputRows, currentTransactionRow } =
        await this.transactionProcessor.processOutput(
          transaction,
          blockData.height
        );

      const { currentSpentOutputRows, currentBalanceDeltas } =
        await this.transactionProcessor.processSpentOutput(
          existingOutputsBalance,
          blockData.height,
          transaction.id
        );

      transactionTableRows.push(...currentTransactionRow);
      outputTableRows.push(...currentOutputRows);
      spentOutputTableRows.push(...currentSpentOutputRows);

      for (const [address, balanceDelta] of currentBalanceDeltas.entries()) {
        balanceDeltas.set(
          address,
          (balanceDeltas.get(address) ?? 0) + balanceDelta
        );
      }
    }

    // calculate the balance deltas for the new outputs
    for (const output of outputTableRows) {
      balanceDeltas.set(
        output.address,
        (balanceDeltas.get(output.address) ?? 0) + parseFloat(output.amount)
      );
    }

    const balanceDeltaTableRows =
      this.transactionProcessor.formatBalanceDeltaTableRows({
        balanceDeltaTableRows: balanceDeltas,
        height: blockData.height,
      });

    return await this.repository.saveBlock({
      block: { height: blockData.height, id: blockData.id },
      transactions: transactionTableRows,
      outputs: outputTableRows,
      spentOutputs: spentOutputTableRows,
      balanceDeltas: balanceDeltaTableRows,
    });
  }

  async rollbackBlock(height: number) {
    const block = await this.repository.getBlock(height);

    if (!block) {
      throw new Error('Block not found');
    }

    return await this.repository.rollbackBlock(height);
  }
}
