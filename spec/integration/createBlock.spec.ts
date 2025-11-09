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
import { createMockGenesisBlockDatabaseState } from 'spec/helpers';
import {
  blockWithIncompleteInputBalanceSpending,
  blockWithInvalidInputTransactionAndIndexPair,
  genesisBalanceDeltas,
  genesisBlock,
  genesisOutputs,
  genesisTransactions,
  regularBlockAfterGenesisBlock,
} from './testConstants';

describe('Creat block integration test', () => {
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

  describe('POST /blocks', () => {
    test('should create genesis block successfully', async () => {
      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify(genesisBlock),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Block created successfully',
      });

      // Verify database state
      const blocks = await db.select().from(schema.blocks);
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toEqual({
        id: genesisBlock.id,
        height: 1,
        createdAt: expect.any(String),
      });

      const transactions = await db.select().from(schema.transactions);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(genesisTransactions);

      const outputs = await db.select().from(schema.outputs);
      expect(outputs).toHaveLength(2);
      expect(outputs).toEqual(
        expect.arrayContaining([
          expect.objectContaining(genesisOutputs[0]),
          expect.objectContaining(genesisOutputs[1]),
        ])
      );

      const balanceDeltas = await db.select().from(schema.balanceDeltas);
      expect(balanceDeltas).toHaveLength(2);
      expect(balanceDeltas).toEqual(
        expect.arrayContaining([
          expect.objectContaining(genesisBalanceDeltas[0]),
          expect.objectContaining(genesisBalanceDeltas[1]),
        ])
      );
    });

    test('should create regular transaction block successfully after a genesis block', async () => {
      // mock a genesis block database state
      await createMockGenesisBlockDatabaseState(db);
      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify(regularBlockAfterGenesisBlock),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Block created successfully',
      });

      // Verify database state
      const blocks = await db.select().from(schema.blocks);
      expect(blocks).toHaveLength(2);
      expect(blocks[1]).toEqual({
        id: regularBlockAfterGenesisBlock.id,
        height: regularBlockAfterGenesisBlock.height,
        createdAt: expect.any(String),
      });

      const transactions = await db.select().from(schema.transactions);
      expect(transactions).toHaveLength(2);
      expect(transactions[1]).toEqual({
        id: regularBlockAfterGenesisBlock.transactions[0].id,
        blockHeight: regularBlockAfterGenesisBlock.height,
        createdAt: expect.any(String),
      });
    });

    test('should return 400 if the block height is invalid', async () => {
      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify(regularBlockAfterGenesisBlock),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Invalid block height',
      });
    });

    test('should return 400 if the block id is invalid', async () => {
      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify({ ...genesisBlock, id: 'invalid-id' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Invalid block id',
      });
    });

    test('should return 400 if input balance is not fully spent', async () => {
      await createMockGenesisBlockDatabaseState(db);

      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify({ ...blockWithIncompleteInputBalanceSpending }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Total input amount does not match total output amount',
      });
    });

    test('should return 400 if input transaction and index pair does not exist', async () => {
      await createMockGenesisBlockDatabaseState(db);

      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify(blockWithInvalidInputTransactionAndIndexPair),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: 'Some of the input transaction and index pairs do not exist!',
      });
    });

    test('should return 400 if input transaction and index pair has already been spent', async () => {
      await createMockGenesisBlockDatabaseState(db);

      await db.insert(schema.spentOutputs).values([
        {
          txId: genesisOutputs[0].txId,
          index: genesisOutputs[0].index,
          spentAtHeight: 1,
          spentByTransactionId: genesisBlock.transactions[0].id,
        },
      ]);

      const response = await fetch(`${baseUrl}/block`, {
        method: 'POST',
        body: JSON.stringify(regularBlockAfterGenesisBlock),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message:
          'The inputs with transaction and index pairs (genesistx123, 0) have already been spent',
      });
    });
  });
});
