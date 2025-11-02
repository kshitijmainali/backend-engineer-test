import type { TSchema } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

export const validateWithSchema = (schema: TSchema, data: unknown) => {
  const compiled = TypeCompiler.Compile(schema);
  const isValid = compiled.Check(data);

  return { isValid };
};
