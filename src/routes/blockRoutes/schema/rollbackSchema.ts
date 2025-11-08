import { Type } from '@sinclair/typebox';

const RollbackSchema = {
  params: Type.Object({
    height: Type.Integer({
      minimum: 1,
    }),
  }),
  response: {
    200: Type.Object({
      message: Type.String(),
    }),
    400: Type.Object({
      message: Type.String(),
    }),
  },
};

export default RollbackSchema;
