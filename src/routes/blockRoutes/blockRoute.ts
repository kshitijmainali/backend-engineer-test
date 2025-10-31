import { type FastifyInstance } from 'fastify';
import { PostBlockSchema, type PostBlockBody } from './schema/postBlock';

const blockRoute = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: PostBlockBody }>(
    '/block',
    { schema: PostBlockSchema },
    async (request, reply) => {
      const { height, id, transactions } = request.body;
      console.log(height, id, transactions);
      return reply.status(201).send({ message: 'Block created successfully' });
    }
  );
};

export default blockRoute;
