import { type FastifyInstance } from 'fastify';
import {
  getAddressBalanceController,
  postBlockController,
  rollbackController,
} from './controllers';
import GetAddressBalanceSchema from './schema/getAdressBalance';
import { PostBlockSchema, type PostBlockBody } from './schema/postBlock';
import RollbackSchema from './schema/rollbackSchema';
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

  fastify.post<{ Params: { height: number } }>(
    '/rollback/:height',
    {
      schema: RollbackSchema,
    },
    rollbackController
  );
};

export default blockRoute;
