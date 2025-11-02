import { type FastifyInstance } from 'fastify';
import { getAdressBalance, postBlock } from './controllers';
import { PostBlockSchema, type PostBlockBody } from './schema/postBlock';
import { validateBlock } from './validators/postBlockValidator';

const blockRoute = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: PostBlockBody }>(
    '/block',
    {
      schema: PostBlockSchema,
      preHandler: validateBlock,
    },
    postBlock
  );

  fastify.get<{ Params: { address: string } }>(
    '/balance/:address',
    getAdressBalance
  );
};

export default blockRoute;
