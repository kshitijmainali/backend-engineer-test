import { type FastifyInstance } from "fastify";

const defaultRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", async () => {
    return { hello: "world" };
  });
};

export default defaultRoutes;
