import fastify from 'fastify';
import dbPlugin from './plugins/database';
import globalErrorHandler from './plugins/errorHandler';
import defaultRoutes from './routes';
import blockRoute from './routes/blockRoutes';

const buildApp = () => {
  const app = fastify({
    logger: false,
    ajv: {
      customOptions: {
        allErrors: true,
        verbose: true,
      },
    },
  });
  app.register(globalErrorHandler);
  app.register(dbPlugin);

  // Register routes
  app.register(defaultRoutes);
  app.register(blockRoute);

  return app;
};

export default buildApp;
