import { Type, type Static } from '@sinclair/typebox';

const InputSchema = Type.Object({
  txId: Type.String(),
  index: Type.Number(),
});

const OutputSchema = Type.Object({
  address: Type.String(),
  value: Type.Number(),
});

const TransactionSchema = Type.Object({
  id: Type.String(),
  inputs: Type.Array(InputSchema),
  outputs: Type.Array(OutputSchema),
});

const PostBlockSchema = {
  body: Type.Object({
    height: Type.Integer(),
    id: Type.String(),
    transactions: Type.Array(TransactionSchema),
  }),
};

type PostBlockBody = Static<typeof PostBlockSchema.body>;
type TransactionRequestBody = Static<typeof TransactionSchema>;
export { PostBlockSchema, type PostBlockBody, type TransactionRequestBody };
