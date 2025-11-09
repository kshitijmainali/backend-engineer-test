import * as schema from '@/db/schema';
import type { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import {
  genesisBalanceDeltas,
  genesisBlockRow,
  genesisOutputs,
  genesisTransactions,
} from './integration/testConstants';

export const validateWithSchema = (schema: TSchema, data: unknown) => {
  const compiled = TypeCompiler.Compile(schema);
  const isValid = compiled.Check(data);

  return { isValid };
};

export const createMockGenesisBlockDatabaseState = async (db: any) => {
  await db.insert(schema.blocks).values({
    id: genesisBlockRow.id,
    height: genesisBlockRow.height,
  });
  await db.insert(schema.transactions).values([
    {
      id: genesisTransactions.id,
      blockHeight: genesisTransactions.blockHeight,
    },
  ]);
  await db
    .insert(schema.outputs)
    .values([genesisOutputs[0], genesisOutputs[1]]);
  await db
    .insert(schema.balanceDeltas)
    .values([genesisBalanceDeltas[0], genesisBalanceDeltas[1]]);
};
