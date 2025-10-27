import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import buildApp from './app';

const handleUnhandledErrors = (fastifyInstance: FastifyInstance) => {
  process.on('unhandledRejection', (reason) => {
    fastifyInstance.log.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
  process.on('uncaughtException', (err) => {
    fastifyInstance.log.error('Uncaught Exception:', err);
    process.exit(1);
  });
};

const gracefulShutdown = async (fastifyInstance: FastifyInstance) => {
  process.on('SIGINT', () => {
    fastifyInstance.log.info('Received SIGINT. Closing server...');
    fastifyInstance.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    fastifyInstance.log.info('Received SIGTERM. Closing server...');
    fastifyInstance.close();
    process.exit(0);
  });
};
try {
  const app = buildApp();

  handleUnhandledErrors(app);
  gracefulShutdown(app);

  await app.listen({
    port: 3000,
    host: '0.0.0.0',
  });
  console.log('🟢 Server is running on port 3000');
} catch (err) {
  console.error(err);
  process.exit(1);
}
