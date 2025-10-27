import fastify from 'fastify';
import dbPlugin from './plugins/database';
import globalErrorHandler from './plugins/errorHandler';
import defaultRoutes from './routes';

const buildApp = () => {
  const app = fastify({ logger: false });
  app.register(globalErrorHandler);
  app.register(dbPlugin);

  // Register routes
  app.register(defaultRoutes);

  return app;
};

export default buildApp;
