import { and, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../../@types/fastify';
import { outputs } from '../../../db/schema';
import type { TransactionRequestBody } from '../schema/postBlock';

const validateOutputBalance = async (
  transaction: TransactionRequestBody,
  db: DatabaseClient
) => {
  // if there is an input, then we need to check if the sum of the inputs is equal to the sum of the outputs
  const existingOutputs = await Promise.all(
    transaction.inputs.map(async (input) => {
      const [output] = await db
        .select()
        .from(outputs)
        .where(
          and(eq(outputs.txId, input.txId), eq(outputs.index, input.index))
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
    throw new Error('Total input amount does not match total output amount');
  }

  return existingOutputs;
};

export { validateOutputBalance };
