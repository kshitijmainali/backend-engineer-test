import { eq, sum } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  balanceDeltas,
  blocks,
  outputs,
  spentOutputs,
  transactions,
  type OutputTableRow,
  type SpentOutputTableRow,
  type TransactionTableRow,
} from '../../../db/schema';
import type { PostBlockBody } from '../schema/postBlock';
import { validateOutputBalance } from '../validators/outputBalanceValidator';
import { validateTransactionId } from '../validators/transactionIdValidator';

const getAddressBalanceController = async (
  request: FastifyRequest<{ Params: { address: string } }>,
  reply: FastifyReply
) => {
  try {
    const { address } = request.params;
    if (!address) {
      throw new Error('Address is required');
    }
    const [totalBalance] = await request.server.db
      .select({
        balance: sum(balanceDeltas.balanceDelta),
      })
      .from(balanceDeltas)
      .where(eq(balanceDeltas.address, address));

    return reply.send({ balance: totalBalance.balance ?? 0 });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const postBlockController = async (
  request: FastifyRequest<{ Body: PostBlockBody }>,
  reply: FastifyReply
) => {
  try {
    const { transactions: transactionsBody } = request.body;

    await validateTransactionId(transactionsBody, request.server.db);

    const blockTableRow = {
      id: request.body.id,
      height: request.body.height,
    };
    const transactionTableRows: Omit<TransactionTableRow, 'createdAt'>[] = [];
    const outputTableRows: Omit<OutputTableRow, 'id' | 'createdAt'>[] = [];
    const spentOutputTableRows: Omit<
      SpentOutputTableRow,
      'id' | 'createdAt'
    >[] = [];

    const balanceDeltaTableRows: Map<string, number> = new Map();

    for (const transaction of transactionsBody) {
      // if there is no input, then this is a coinbase transaction and txn is valid
      if (!transaction.inputs.length) {
        transactionTableRows.push({
          id: transaction.id,
          blockHeight: request.body.height,
        });
        for (const [index, output] of transaction.outputs.entries()) {
          outputTableRows.push({
            txId: transaction.id,
            index,
            address: output.address,
            amount: output.value.toString(),
            blockHeight: request.body.height,
          });
        }
        continue;
      }

      const existingOutputs = await validateOutputBalance(
        transaction,
        request.server.db
      );
      for (const output of existingOutputs) {
        spentOutputTableRows.push({
          txId: output.txId,
          index: output.index,
          spentAtHeight: request.body.height,
          spentByTransactionId: transaction.id,
        });
        balanceDeltaTableRows.set(
          output.address,
          (balanceDeltaTableRows.get(output.address) ?? 0) -
            parseFloat(output.amount)
        );
      }

      for (const [index, output] of transaction.outputs.entries()) {
        outputTableRows.push({
          txId: transaction.id,
          index,
          address: output.address,
          amount: output.value.toString(),
          blockHeight: request.body.height,
        });
      }
      transactionTableRows.push({
        id: transaction.id,
        blockHeight: request.body.height,
      });
    }

    for (const output of outputTableRows) {
      balanceDeltaTableRows.set(
        output.address,
        (balanceDeltaTableRows.get(output.address) ?? 0) +
          parseFloat(output.amount)
      );
    }

    const balanceDeltaTableRowsArray = Array.from(
      balanceDeltaTableRows.entries()
    ).map(([address, balanceDelta]) => ({
      address,
      balanceDelta: balanceDelta.toString(),
      blockHeight: request.body.height,
    }));

    if (outputTableRows.length) {
      await request.server.db.transaction(async (tx) => {
        await tx.insert(blocks).values(blockTableRow).execute();
        await tx.insert(transactions).values(transactionTableRows).execute();
        await tx.insert(outputs).values(outputTableRows).execute();
        if (spentOutputTableRows.length) {
          await tx.insert(spentOutputs).values(spentOutputTableRows).execute();
        }
        await tx
          .insert(balanceDeltas)
          .values(balanceDeltaTableRowsArray)
          .execute();
      });
    }

    return reply.status(201).send({ message: 'Block created successfully' });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { getAddressBalanceController, postBlockController };
