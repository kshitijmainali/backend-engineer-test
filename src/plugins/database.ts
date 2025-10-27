import type { FastifyInstance } from "fastify";
import pg from "pg";

const { Pool } = pg;

async function dbPlugin(fastify: FastifyInstance) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await pool.connect();
    fastify.log.info("🟢 PostgreSQL connected successfully");

    fastify.addHook("onClose", async (fastifyInstance) => {
      await pool.end();
      fastifyInstance.log.info("🔴 PostgreSQL connection closed");
    });

    fastify.decorate("db", pool);
  } catch (err) {
    fastify.log.error("❌ PostgreSQL connection error:", err);
    throw err;
  }
}

export default dbPlugin;
