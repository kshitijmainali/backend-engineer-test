import { BadRequestError } from '@/utils/appError';
import { sql } from 'drizzle-orm';
import type { DatabaseClient } from '../../../@types/fastify';
import { outputs, spentOutputs } from '../../../db/schema';
import type { TransactionRequestBody } from '../schema/postBlock';

const validateOutputBalance = async (
  transaction: TransactionRequestBody,
  db: DatabaseClient
) => {
  if (!transaction.inputs.length) {
    return [];
  }

  const existingOutputKeys = transaction.inputs.map(
    (input) => sql`(${input.txId}, ${input.index})`
  );

  const existingOutputs = await db
    .select()
    .from(outputs)
    .where(sql`(tx_id, index) IN (${sql.join(existingOutputKeys, sql`,`)})`);

  if (existingOutputs?.length !== existingOutputKeys.length) {
    throw new BadRequestError(
      `Some of the input transaction and index pairs do not exist!`
    );
  }

  const totalInputAmount = existingOutputs.reduce(
    (acc, output) => acc + parseFloat(output.amount),
    0
  );

  const totalOutputAmount = transaction.outputs.reduce(
    (acc, output) => acc + output.value,
    0
  );

  if (totalInputAmount !== totalOutputAmount) {
    throw new BadRequestError(
      'Total input amount does not match total output amount'
    );
  }

  const alreadySpentOutputs = await db
    .select()
    .from(spentOutputs)
    .where(sql`(tx_id, index) IN (${sql.join(existingOutputKeys, sql`,`)})`);

  if (alreadySpentOutputs?.length > 0) {
    throw new BadRequestError(
      `The outputs with transaction and index pairs ${alreadySpentOutputs.map((spentOutput) => `(${spentOutput.txId}, ${spentOutput.index})`).join(', ')} have already been spent`
    );
  }

  return existingOutputs;
};

export { validateOutputBalance };
