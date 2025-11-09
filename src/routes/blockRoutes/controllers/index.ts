import { AppError } from '@/utils/appError';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PostBlockBody } from '../schema/postBlock';
import BalanceService from '../services/balanceService';
import { BlockService } from '../services/blockService';

const postBlockController = async (
  request: FastifyRequest<{ Body: PostBlockBody }>,
  reply: FastifyReply
) => {
  try {
    const blockService = new BlockService(request.server.db);
    await blockService.createBlock(request.body);
    return reply.status(201).send({ message: 'Block created successfully' });
  } catch (error) {
    console.error(error);
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

const getAddressBalanceController = async (
  request: FastifyRequest<{ Params: { address: string } }>,
  reply: FastifyReply
) => {
  try {
    const { address } = request.params;
    const balanceService = new BalanceService(request.server.db);
    const balance = await balanceService.getAddressBalance(address);
    return reply.send({ balance });
  } catch (error) {
    console.error(error);
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

const rollbackController = async (
  request: FastifyRequest<{ Params: { height: number } }>,
  reply: FastifyReply
) => {
  try {
    const { height } = request.params;
    const blockService = new BlockService(request.server.db);
    await blockService.rollbackBlock(height);
    return reply.status(200).send({ message: 'Rollback successful' });
  } catch (error) {
    console.error(error);
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    return reply.status(500).send({ message: 'Internal server error' });
  }
};

export { getAddressBalanceController, postBlockController, rollbackController };
