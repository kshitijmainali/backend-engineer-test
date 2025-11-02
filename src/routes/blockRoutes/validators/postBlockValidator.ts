import crypto from 'crypto';
import { max } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { blocks } from '../../../db/schema';
import type { PostBlockBody } from '../schema/postBlock';

const validateBlock = async (
  request: FastifyRequest<{ Body: PostBlockBody }>
) => {
  const { height, id, transactions } = request.body;

  const transactionIds = transactions
    .map((transaction) => transaction.id)
    .join('');

  const blockId = crypto
    .createHash('sha256')
    .update(height.toString() + transactionIds)
    .digest('hex');

  if (blockId !== id) {
    throw new Error('Invalid block id');
  }

  const [latestBlock] = await request.server.db
    .select({
      recentHeight: max(blocks.height),
    })
    .from(blocks)
    .limit(1);

  if (latestBlock.recentHeight && latestBlock.recentHeight !== height - 1) {
    throw new Error('Invalid block height');
  }

  if (!latestBlock.recentHeight && height !== 1) {
    throw new Error('Invalid block height');
  }

  if (height > 1 && !transactions.length) {
    throw new Error('Transactions are required for non-coinbase blocks');
  }
};

export { validateBlock };
