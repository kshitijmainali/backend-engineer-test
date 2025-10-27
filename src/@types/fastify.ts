// src/types/fastify.d.ts
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

declare module 'fastify' {
  interface FastifyInstance {
    db: PostgresJsDatabase<typeof schema>;
  }
}
