import { inArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../../@types/fastify';
import { outputs } from '../../../db/schema';
import type { TransactionRequestBody } from '../schema/postBlock';

const validateTransactionId = async (
  transactionsBody: TransactionRequestBody[],
  db: DatabaseClient
) => {
  const transactionIds = transactionsBody.map((transaction) => transaction.id);

  const uniqueTransactionIds = [...new Set(transactionIds)];

  if (uniqueTransactionIds.length !== transactionIds.length) {
    throw new Error('Duplicate transaction ids found in the block');
  }

  const existingTransactionWithSameIds = await db
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
};

export { validateTransactionId };
