import { type FastifyInstance } from "fastify";

const defaultRoutes = (fastify: FastifyInstance) => {
  fastify.get("/", async () => {
    return { hello: "world" };
  });
};

export default defaultRoutes;
