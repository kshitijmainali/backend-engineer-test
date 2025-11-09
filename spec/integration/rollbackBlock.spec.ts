import * as schema from '@/db/schema';
import dbPlugin from '@/plugins/database';
import blockRoutes from '@/routes/blockRoutes';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from 'bun:test';
import 'dotenv/config';
import { fastify, type FastifyInstance } from 'fastify';
import {
  createMockGenesisBlockDatabaseState,
  createMockRegularBlockDatabaseState,
} from 'spec/helpers';
import {
  genesisBlockRow,
  genesisTransactions,
} from './integrationTestConstants';

describe('Rollback block integration test', () => {
  let app: FastifyInstance;
  let db: any;
  let baseUrl: string;
  let logSpy: ReturnType<typeof mock>;

  beforeAll(async () => {
    app = fastify({ logger: false });
    await app.register(dbPlugin);
    await app.register(blockRoutes);
    await app.ready();
    logSpy = spyOn(console, 'error');

    //NOTE: start the server as app.inject is not yet supported in Bun.test
    baseUrl = await app.listen({ port: 8585, host: '127.0.0.1' });

    db = (app as any).db;
  });

  beforeEach(async () => {
    await db.delete(schema.balanceDeltas);
    await db.delete(schema.spentOutputs);
    await db.delete(schema.outputs);
    await db.delete(schema.transactions);
    await db.delete(schema.blocks);
  });

  afterAll(async () => {
    logSpy.mockRestore();
    await app.close();
  });

  describe('POST /rollback/:height', () => {
    test('should rollback block successfully', async () => {
      await createMockGenesisBlockDatabaseState(db);
      await createMockRegularBlockDatabaseState(db);
      const response = await fetch(`${baseUrl}/rollback/1`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Rollback successful',
      });

      const blocks = await db.select().from(schema.blocks);
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toEqual(genesisBlockRow);

      const transactions = await db.select().from(schema.transactions);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(genesisTransactions);

      const outputs = await db.select().from(schema.outputs);
      expect(outputs).toHaveLength(2);
      expect(outputs[0].address).toBe('1');
      expect(outputs[0].amount).toBe('50');
      expect(outputs[1].address).toBe('2');
      expect(outputs[1].amount).toBe('25');
    });

    test('should return 400 if the height is less than 1', async () => {
      const response = await fetch(`${baseUrl}/rollback/0`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'params/height must be >= 1',
      });
    });

    test('should return 400 if the height is not found', async () => {
      const response = await fetch(`${baseUrl}/rollback/1`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Block not found',
      });
    });
  });
});
