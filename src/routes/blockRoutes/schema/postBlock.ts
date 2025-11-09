import { Type, type Static } from '@sinclair/typebox';

const InputSchema = Type.Object({
  txId: Type.String({
    minLength: 1,
    description:
      'The transaction id of the input. Must be a valid Bitcoin transaction id.',
    pattern: '^[a-zA-Z0-9]+$',
  }),
  index: Type.Integer({
    minimum: 0,
  }),
});

const OutputSchema = Type.Object({
  address: Type.String({
    minLength: 1,
    pattern: '^[a-zA-Z0-9]+$',
    description: 'The address of the output. Must be a valid Bitcoin address.',
  }),
  value: Type.Number({
    minimum: 0,
  }),
});

const TransactionSchema = Type.Object({
  id: Type.String({
    minLength: 1,
    pattern: '^[a-zA-Z0-9]+$',
  }),
  inputs: Type.Array(InputSchema),
  outputs: Type.Array(OutputSchema),
});

const PostBlockSchema = {
  body: Type.Object({
    height: Type.Integer({
      minimum: 1,
    }),
    id: Type.String({
      minLength: 1,
    }),
    transactions: Type.Array(TransactionSchema),
  }),
};

type PostBlockBody = Static<typeof PostBlockSchema.body>;
type TransactionRequestBody = Static<typeof TransactionSchema>;
type InputRequestBody = Static<typeof InputSchema>;
type OutputRequestBody = Static<typeof OutputSchema>;
export {
  PostBlockSchema,
  type InputRequestBody,
  type OutputRequestBody,
  type PostBlockBody,
  type TransactionRequestBody,
};
