import { and, eq, sql, sum } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  blocks,
  outputs,
  transactions,
  type OutputTableRow,
  type TransactionTableRow,
} from '../../../db/schema';
import type { PostBlockBody } from '../schema/postBlock';
import { validateOutputBalance } from '../validators/outputBalanceValidator';
import { validateTransactionId } from '../validators/transactionIdValidator';

const getAdressBalance = async (
  request: FastifyRequest<{ Params: { address: string } }>,
  reply: FastifyReply
) => {
  try {
    const { address } = request.params;
    if (!address) {
      return reply.status(400).send({ message: 'Address is required' });
    }
    const [totalBalance] = await request.server.db
      .select({
        balance: sum(outputs.amount),
      })
      .from(outputs)
      .where(and(eq(outputs.address, address), eq(outputs.spent, false)));

    return reply.send({ balance: totalBalance.balance ?? 0 });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const postBlock = async (
  request: FastifyRequest<{ Body: PostBlockBody }>,
  reply: FastifyReply
) => {
  try {
    const { transactions: transactionsBody } = request.body;

    await validateTransactionId(transactionsBody, request.server.db);

    const outputTableRows: Omit<OutputTableRow, 'id' | 'createdAt'>[] = [];
    const blockTableRow = {
      height: request.body.height,
    };
    const transactionTableRows: Omit<TransactionTableRow, 'createdAt'>[] = [];
    const spentExistingOutputs: { txId: string; index: number }[] = [];

    for (const transaction of transactionsBody) {
      // if there is no input, then this is a coinbase transaction and txn is valid
      if (!transaction.inputs.length) {
        for (const [index, output] of transaction.outputs.entries()) {
          outputTableRows.push({
            txId: transaction.id,
            index,
            address: output.address,
            spent: false,
            blockHeight: request.body.height,
            amount: output.value.toString(),
          });
        }
        transactionTableRows.push({
          id: transaction.id,
          blockHeight: request.body.height,
        });
        continue;
      }

      const existingOutputs = await validateOutputBalance(
        transaction,
        request.server.db
      );
      for (const output of existingOutputs) {
        spentExistingOutputs.push({
          txId: output.txId,
          index: output.index,
        });
      }

      for (const [index, output] of transaction.outputs.entries()) {
        outputTableRows.push({
          txId: transaction.id,
          index,
          address: output.address,
          spent: false,
          blockHeight: request.body.height,
          amount: output.value.toString(),
        });
      }
      transactionTableRows.push({
        id: transaction.id,
        blockHeight: request.body.height,
      });
    }

    await request.server.db.transaction(async (tx) => {
      await tx.insert(blocks).values(blockTableRow).execute();
      await tx.insert(transactions).values(transactionTableRows).execute();
      if (spentExistingOutputs.length) {
        await tx.execute(
          sql`UPDATE outputs SET spent = true WHERE (tx_id, "index") IN (${sql.join(
            spentExistingOutputs.map((o) => sql`(${o.txId}, ${o.index})`),
            sql`,`
          )});`
        );
      }
      await tx.insert(outputs).values(outputTableRows).execute();
    });

    return reply.status(201).send({ message: 'Block created successfully' });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { getAdressBalance, postBlock };
