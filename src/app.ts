import fastify from "fastify";
import defaultRoutes from "./routes";

const buildApp = () => {
  const app = fastify({ logger: true });

  defaultRoutes(app);

  return app;
};

export default buildApp;
