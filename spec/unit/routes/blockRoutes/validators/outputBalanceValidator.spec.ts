import type { TransactionRequestBody } from '@/routes/blockRoutes/schema/postBlock';
import { validateOutputBalance } from '@/routes/blockRoutes/validators/outputBalanceValidator';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockOutput = {
  id: 1,
  txId: 'tx1',
  index: 0,
  address: 'addr1',
  amount: '10',
  spent: false,
  blockHeight: 1,
  createdAt: '2021-01-01T00:00:00Z',
};

let mockDb = null as any;
describe('outputBalanceValidator', () => {
  beforeEach(() => {
    mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve([mockOutput])),
        })),
      })),
    };
  });

  test('should handle genesis transaction', async () => {
    mockDb.select.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([])),
      })),
    });

    const transaction = {
      id: 'tx1',
      inputs: [],
      outputs: [{ address: 'addr1', value: 10 }],
    } as TransactionRequestBody;

    await expect(validateOutputBalance(transaction, mockDb)).resolves.toEqual(
      []
    );
  });

  test('should return existing outputs when balance is valid', async () => {
    const transaction = {
      id: 'tx2',
      inputs: [{ txId: 'tx1', index: 0 }],
      outputs: [{ address: 'addr1', value: 10 }],
    } as TransactionRequestBody;

    await expect(validateOutputBalance(transaction, mockDb)).resolves.toEqual([
      mockOutput,
    ]);
  });

  test('should throw error when total input amount does not match total output amount', async () => {
    const transaction = {
      id: 'tx3',
      inputs: [{ txId: 'tx1', index: 0 }],
      outputs: [{ address: 'addr1', value: 5 }],
    } as TransactionRequestBody;

    await expect(validateOutputBalance(transaction, mockDb)).rejects.toThrow(
      'Total input amount does not match total output amount'
    );
  });

  test('should throw error when input is spent', async () => {
    mockDb.select.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([{ ...mockOutput, spent: true }])),
      })),
    });

    const transaction = {
      id: 'tx4',
      inputs: [{ txId: 'tx1', index: 0 }],
      outputs: [{ address: 'addr1', value: 10 }],
    } as TransactionRequestBody;

    await expect(validateOutputBalance(transaction, mockDb)).rejects.toThrow(
      'The transaction with id tx1 and index 0 has already been spent'
    );
  });

  test('should throw error when input does not exist', async () => {
    mockDb.select.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([])),
      })),
    });

    const transaction = {
      id: 'tx5',
      inputs: [{ txId: 'tx1', index: 0 }],
      outputs: [{ address: 'addr1', value: 10 }],
    } as TransactionRequestBody;

    await expect(validateOutputBalance(transaction, mockDb)).rejects.toThrow(
      'The transaction with id tx1 and index 0 does not exist'
    );
  });
});
