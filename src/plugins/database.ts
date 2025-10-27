import type { FastifyInstance } from "fastify";
import { Pool } from "pg";

async function dbPlugin(fastify: FastifyInstance, options: any) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await pool.connect();
    fastify.log.info("🟢 PostgreSQL connected successfully");

    fastify.decorate("db", pool);

    fastify.addHook("onClose", async (fastifyInstance) => {
      await pool.end();
      fastifyInstance.log.info("🔴 PostgreSQL connection closed");
    });
  } catch (err) {
    fastify.log.error("❌ PostgreSQL connection error:", err);
    throw err;
  }
}

export default dbPlugin;
