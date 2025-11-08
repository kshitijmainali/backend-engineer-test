import { type FastifyInstance } from 'fastify';
import {
  getAddressBalanceController,
  postBlockController,
} from './controllers';
import GetAddressBalanceSchema from './schema/getAdressBalance';
import { PostBlockSchema, type PostBlockBody } from './schema/postBlock';
import { validateBlock } from './validators/postBlockValidator';

const blockRoute = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: PostBlockBody }>(
    '/block',
    {
      schema: PostBlockSchema,
      preHandler: validateBlock,
    },
    postBlockController
  );

  fastify.get<{ Params: { address: string } }>(
    '/balance/:address',
    {
      schema: GetAddressBalanceSchema,
    },
    getAddressBalanceController
  );
};

export default blockRoute;
