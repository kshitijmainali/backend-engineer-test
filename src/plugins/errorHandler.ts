import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function globalErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, _, reply) => {
    const errorMessage = error.message || 'Internal Server Error';
    const errorStatus = error.statusCode || 500;
    fastify.log.error('Error details:', error);
    reply.status(errorStatus).send({ status: 'error', message: errorMessage });
  });
}

export default fp(globalErrorHandler, { name: 'globalErrorHandler' });
