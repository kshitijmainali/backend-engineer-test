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
let mockWhere = null as any;
let mockFrom = null as any;
let mockSelect = null as any;

describe('outputBalanceValidator', () => {
  beforeEach(() => {
    mockWhere = mock(() => Promise.resolve([] as any[]));
    mockFrom = mock(() => ({ where: mockWhere }));
    mockSelect = mock(() => ({ from: mockFrom }));
    mockDb = { select: mockSelect } as any;
  });

  test('should handle genesis transaction', async () => {
    mockWhere.mockImplementation(() => Promise.resolve([]));

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

    mockWhere.mockImplementation(() => Promise.resolve([mockOutput]));

    await expect(validateOutputBalance(transaction, mockDb)).resolves.toEqual([
      mockOutput,
    ]);
  });

  test('should handle multiple inputs', async () => {
    mockWhere.mockResolvedValueOnce([mockOutput]);
    mockWhere.mockResolvedValueOnce([{ ...mockOutput, txId: 'tx2', index: 0 }]);

    const transaction = {
      id: 'tx3',
      inputs: [
        { txId: 'tx1', index: 0 },
        { txId: 'tx2', index: 0 },
      ],
      outputs: [
        { address: 'addr1', value: 10 },
        { address: 'addr2', value: 10 },
      ],
    } as TransactionRequestBody;

    await expect(validateOutputBalance(transaction, mockDb)).resolves.toEqual([
      { ...mockOutput, txId: 'tx1', index: 0 },
      { ...mockOutput, txId: 'tx2', index: 0 },
    ]);
  });

  test('should throw error when total input amount does not match total output amount', async () => {
    mockWhere.mockImplementation(() => Promise.resolve([mockOutput]));
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
    mockWhere.mockImplementation(() =>
      Promise.resolve([{ ...mockOutput, spent: true }])
    );

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
    mockWhere.mockImplementation(() => Promise.resolve([]));

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
