import { drizzle } from 'drizzle-orm/node-postgres';
import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from 'pg';
import * as schema from '../db/schema';
const { Pool } = pg;

async function dbPlugin(fastify: FastifyInstance) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const db = drizzle<typeof schema>(pool);

  fastify.decorate('db', db);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });

  fastify.log.info('✅ PostgreSQL + Drizzle connected');
}

export default fp(dbPlugin);
