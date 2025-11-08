import { BadRequestError } from '@/utils/appError';
import { inArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../../@types/fastify';
import { transactions } from '../../../db/schema';
import type { TransactionRequestBody } from '../schema/postBlock';

const validateTransactionId = async (
  transactionsBody: TransactionRequestBody[],
  db: DatabaseClient
) => {
  if (transactionsBody.length === 0) {
    return;
  }

  const transactionIds = transactionsBody.map((transaction) => transaction.id);

  const uniqueTransactionIds = [...new Set(transactionIds)];

  if (uniqueTransactionIds.length !== transactionIds.length) {
    throw new BadRequestError('Duplicate transaction ids found in the block');
  }

  const existingTransactionWithSameIds = await db
    .select({
      txId: transactions.id,
    })
    .from(transactions)
    .where(inArray(transactions.id, transactionIds));

  if (existingTransactionWithSameIds.length > 0) {
    throw new BadRequestError(
      `Transaction with ids ${transactionIds.join(', ')} already exists`
    );
  }
};

export { validateTransactionId };
