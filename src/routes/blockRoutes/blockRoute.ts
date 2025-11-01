import crypto from 'crypto';
import { and, eq, inArray, max } from 'drizzle-orm';
import { type FastifyInstance, type FastifyRequest } from 'fastify';
import {
  balances,
  blocks,
  outputs,
  type OutputTableRow,
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
        const { transactions } = request.body;

        const transactionIds = transactions.map(
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

        for (const transaction of transactions) {
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
        }

        request.server.db.transaction(async (tx) => {
          await tx.insert(outputs).values(outputTableRows).execute();
          await tx
            .insert(balances)
            .values(
              Array.from(balanceTableRows.entries()).map(
                ([address, balance]) => ({
                  address,
                  balance: balance.toString(),
                  updatedAt: new Date().toISOString(),
                })
              )
            )
            .execute();
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
};

export default blockRoute;
