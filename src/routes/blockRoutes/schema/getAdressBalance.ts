import { Type } from '@sinclair/typebox';

const GetAddressBalanceSchema = {
  params: Type.Object({
    address: Type.String({
      minLength: 1,
      pattern: '^[a-zA-Z0-9]+$',
      description: 'The address of the balance to get.',
    }),
  }),
  response: {
    200: Type.Object({
      balance: Type.Number(),
    }),
    400: Type.Object({
      message: Type.String(),
    }),
  },
};

export default GetAddressBalanceSchema;
