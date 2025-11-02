import crypto from 'crypto';
import { and, eq, inArray, max, sql, sum } from 'drizzle-orm';
import { type FastifyInstance, type FastifyRequest } from 'fastify';
import {
  blocks,
  outputs,
  transactions,
  type BlockTableRow,
  type OutputTableRow,
  type TransactionTableRow,
} from '../../db/schema';
import { PostBlockSchema, type PostBlockBody } from './schema/postBlock';

const validateBlock = async (
  request: FastifyRequest<{ Body: PostBlockBody }>
) => {
  const { height, id, transactions } = request.body;

  const transactionIds = transactions
    .map((transaction) => transaction.id)
    .join('');

  const blockId = crypto
    .createHash('sha256')
    .update(height.toString() + transactionIds)
    .digest('hex');

  if (blockId !== id) {
    throw new Error('Invalid block id');
  }

  const [latestBlock] = await request.server.db
    .select({
      recentHeight: max(blocks.height),
    })
    .from(blocks)
    .limit(1);

  if (latestBlock.recentHeight && latestBlock.recentHeight !== height - 1) {
    throw new Error('Invalid block height');
  }

  if (!latestBlock.recentHeight && height !== 1) {
    throw new Error('Invalid block height');
  }
};

const blockRoute = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: PostBlockBody }>(
    '/block',
    { schema: PostBlockSchema, preHandler: validateBlock },
    async (request, reply) => {
      try {
        const { transactions: transactionsBody } = request.body;

        const transactionIds = transactionsBody.map(
          (transaction) => transaction.id
        );

        const uniqueTransactionIds = [...new Set(transactionIds)];

        if (uniqueTransactionIds.length !== transactionIds.length) {
          throw new Error('Duplicate transaction ids found in the block');
        }

        const existingTransactionWithSameIds = await request.server.db
          .select({
            txId: outputs.txId,
          })
          .from(outputs)
          .where(inArray(outputs.txId, transactionIds));

        if (existingTransactionWithSameIds.length > 0) {
          throw new Error(
            `Transaction with ids ${transactionIds.join(', ')} already exists`
          );
        }

        const outputTableRows: Omit<OutputTableRow, 'id' | 'createdAt'>[] = [];
        const balanceTableRows: Map<string, number> = new Map();
        const blockTableRow: BlockTableRow = {
          id: request.body.id,
          height: request.body.height,
          createdAt: new Date().toISOString(),
        };
        const transactionTableRows: Omit<TransactionTableRow, 'createdAt'>[] =
          [];
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

              balanceTableRows.set(
                output.address,
                (balanceTableRows.get(output.address) || 0) + output.value
              );
            }
            transactionTableRows.push({
              id: transaction.id,
              blockHeight: request.body.height,
            });
            continue;
          }

          // if there is an input, then we need to check if the sum of the inputs is equal to the sum of the outputs
          const existingOutputs = await Promise.all(
            transaction.inputs.map(async (input) => {
              const [output] = await request.server.db
                .select()
                .from(outputs)
                .where(
                  and(
                    eq(outputs.txId, input.txId),
                    eq(outputs.index, input.index)
                  )
                );

              if (output && output.spent) {
                throw new Error(
                  `The transaction with id ${input.txId} and index ${input.index} has already been spent`
                );
              }

              if (!output) {
                throw new Error(
                  `The transaction with id ${input.txId} and index ${input.index} does not exist`
                );
              }

              return output;
            })
          );

          const totalInputAmount = existingOutputs.reduce(
            (acc, output) => acc + parseFloat(output.amount),
            0
          );

          const totalOutputAmount = transaction.outputs.reduce(
            (acc, output) => acc + output.value,
            0
          );

          if (totalInputAmount !== totalOutputAmount) {
            throw new Error(
              'Total input amount does not match total output amount'
            );
          }

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

            balanceTableRows.set(
              output.address,
              (balanceTableRows.get(output.address) || 0) + output.value
            );
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

        return reply
          .status(201)
          .send({ message: 'Block created successfully' });
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  );

  fastify.get<{ Params: { address: string } }>(
    '/balance/:address',
    async (request, reply) => {
      const { address } = request.params;
      const [totalBalance] = await request.server.db
        .select({
          balance: sum(outputs.amount),
        })
        .from(outputs)
        .where(and(eq(outputs.address, address), eq(outputs.spent, false)));
      console.log('totalBalance', totalBalance);
      if (totalBalance.balance == null) {
        return reply.status(404).send({ message: 'Address not found' });
      }

      return reply.send({ balance: totalBalance.balance });
    }
  );
};

export default blockRoute;
