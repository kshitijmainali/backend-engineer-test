import fastify from "fastify";
import dbPlugin from "./plugins/database";
import defaultRoutes from "./routes";

const buildApp = () => {
  const app = fastify({ logger: true });

  app.register(dbPlugin);

  defaultRoutes(app);

  return app;
};

export default buildApp;
