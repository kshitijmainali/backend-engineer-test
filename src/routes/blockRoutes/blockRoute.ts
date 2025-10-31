import crypto from 'crypto';
import { type FastifyInstance } from 'fastify';
import { PostBlockSchema, type PostBlockBody } from './schema/postBlock';

const blockRoute = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: PostBlockBody }>(
    '/block',
    { schema: PostBlockSchema },
    async (request, reply) => {
      const { height, id, transactions } = request.body;

      const transactionIds = transactions
        .map((transaction) => transaction.id)
        .join('');

      const blockId = crypto
        .createHash('sha256')
        .update(height.toString() + transactionIds)
        .digest('hex');

      if (blockId !== id) {
        return reply.status(400).send({ message: 'Invalid block id' });
      }

      

      return reply.status(201).send({ message: 'Block created successfully' });
    }
  );
};

export default blockRoute;
