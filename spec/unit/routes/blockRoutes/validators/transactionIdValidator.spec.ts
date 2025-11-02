import type { TransactionRequestBody } from '@/routes/blockRoutes/schema/postBlock';
import { validateTransactionId } from '@/routes/blockRoutes/validators/transactionIdValidator';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

interface IMockTransaction {
  txId: string;
}

let mockDb = null as any;

describe('transactionIdValidator', () => {
  beforeEach(() => {
    mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve([] as IMockTransaction[] | null)),
        })),
      })),
    };
  });

  test('should validate correct transaction ID', async () => {
    const transactions = [
      { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
    ];

    await expect(
      validateTransactionId(transactions, mockDb)
    ).resolves.toBeUndefined();
  });

  test('should throw error for duplicate transaction IDs', async () => {
    const transactions = [
      { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
      { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
    ];

    await expect(validateTransactionId(transactions, mockDb)).rejects.toThrow(
      'Duplicate transaction ids found in the block'
    );
  });

  test('should throw error for transaction IDs that already exist', async () => {
    const transactions = [
      { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
    ];

    mockDb.select.mockReturnValue({
      from: mock(() => ({
        where: mock(() => Promise.resolve([{ txId: 'tx1' }])),
      })),
    });

    await expect(validateTransactionId(transactions, mockDb)).rejects.toThrow(
      'Transaction with ids tx1 already exists'
    );
  });

  test('should handle empty transactions array', async () => {
    const transactions: TransactionRequestBody[] = [];

    console.log(await validateTransactionId(transactions, mockDb));

    await expect(
      validateTransactionId(transactions, mockDb)
    ).resolves.toBeUndefined();
  });
});
