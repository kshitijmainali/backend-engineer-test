import { BlockRepository } from '@/routes/blockRoutes/repositories/blockRepository';
import type {
  InputRequestBody,
  PostBlockBody,
  TransactionRequestBody,
} from '@/routes/blockRoutes/schema/postBlock';
import BlockValidator from '@/routes/blockRoutes/validators';
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import crypto from 'crypto';

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

let mockRequest = {
  server: { db: mockDb },
  body: {} as PostBlockBody,
} as any;
let mockRepository: BlockRepository | null = null;
let blockValidator: BlockValidator | null = null;
describe('BlockValidator', () => {
  describe('transaction id validator', () => {
    beforeEach(() => {
      mockWhere = mock(() => Promise.resolve([] as any[]));
      mockFrom = mock(() => ({ where: mockWhere }));
      mockSelect = mock(() => ({ from: mockFrom }));
      mockDb = { select: mockSelect } as any;

      mockRepository = new BlockRepository(mockDb);
      blockValidator = new BlockValidator(mockRepository);
    });

    test('should validate correct transaction ID', async () => {
      const transactions = [
        { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
      ];

      await expect(
        blockValidator?.validateTransactionId(transactions)
      ).resolves.toBeUndefined();
    });

    test('should throw error for duplicate transaction IDs', async () => {
      const transactions = [
        { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
      ];

      await expect(
        blockValidator?.validateTransactionId(transactions)
      ).rejects.toThrow('Duplicate transaction ids found in the block');
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

      await expect(
        blockValidator?.validateTransactionId(transactions)
      ).rejects.toThrow('Transaction with ids tx1 already exists');
    });

    test('should handle empty transactions array', async () => {
      const transactions: TransactionRequestBody[] = [];

      await expect(
        blockValidator?.validateTransactionId(transactions)
      ).resolves.toBeUndefined();
    });
  });

  describe('output balance validator', () => {
    beforeEach(() => {
      mockWhere = mock(() => Promise.resolve([] as any[]));
      mockFrom = mock(() => ({ where: mockWhere }));
      mockSelect = mock(() => ({ from: mockFrom }));
      mockDb = { select: mockSelect } as any;

      mockRepository = new BlockRepository(mockDb);
      blockValidator = new BlockValidator(mockRepository);
    });

    test('should handle genesis transaction', async () => {
      mockWhere.mockImplementation(() => Promise.resolve([]));

      const transaction = {
        id: 'tx1',
        inputs: [],
        outputs: [{ address: 'addr1', value: 10 }],
      } as TransactionRequestBody;

      await expect(
        blockValidator?.validateOutputBalance(transaction)
      ).resolves.toEqual([]);
    });

    test('should return existing outputs when balance is valid', async () => {
      const transaction = {
        id: 'tx2',
        inputs: [{ txId: 'tx1', index: 0 }],
        outputs: [{ address: 'addr1', value: 10 }],
      } as TransactionRequestBody;

      mockWhere.mockImplementation(() => Promise.resolve([mockOutput]));

      await expect(
        blockValidator?.validateOutputBalance(transaction)
      ).resolves.toEqual([mockOutput]);
    });

    test('should handle multiple inputs', async () => {
      mockWhere.mockResolvedValueOnce([
        mockOutput,
        { ...mockOutput, txId: 'tx2', index: 0 },
      ]);

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

      await expect(
        blockValidator?.validateOutputBalance(transaction)
      ).resolves.toEqual([
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

      await expect(
        blockValidator?.validateOutputBalance(transaction)
      ).rejects.toThrow(
        'Total input amount does not match total output amount'
      );
    });

    test('should throw error when input does not exist', async () => {
      mockWhere.mockImplementation(() => Promise.resolve([]));

      const transaction = {
        id: 'tx5',
        inputs: [{ txId: 'tx1', index: 0 }],
        outputs: [{ address: 'addr1', value: 10 }],
      } as TransactionRequestBody;

      await expect(
        blockValidator?.validateOutputBalance(transaction)
      ).rejects.toThrow(
        'Some of the input transaction and index pairs do not exist!'
      );
    });
  });
  describe('validate block', () => {
    beforeEach(() => {
      mockWhere = mock(() => Promise.resolve([] as any[]));
      mockFrom = mock(() => ({ where: mockWhere }));
      mockSelect = mock(() => ({ from: mockFrom }));
      mockDb = { select: mockSelect } as any;
      mockRequest = {
        server: { db: mockDb },
        body: {} as PostBlockBody,
      } as any;
      mockRepository = new BlockRepository(mockDb);
      blockValidator = new BlockValidator(mockRepository);
    });

    describe('Block ID Validation', () => {
      test('should validate correct block ID', async () => {
        const transactions = [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        ];

        mockRequest.body = {
          height: 1,
          id: crypto.createHash('sha256').update('1tx1').digest('hex'),
          transactions,
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: null }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).resolves.toBeUndefined();
      });

      test('should throw error for invalid block ID', async () => {
        const transactions = [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        ];

        mockRequest.body = {
          height: 1,
          id: 'invalid-id',
          transactions,
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: null }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).rejects.toThrow('Invalid block id');
      });

      test('should validate block ID with multiple transactions', async () => {
        const transactions = [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
          { id: 'tx2', inputs: [], outputs: [{ address: 'addr2', value: 5 }] },
        ];

        mockRequest.body = {
          height: 2,
          id: crypto.createHash('sha256').update('2tx1tx2').digest('hex'),
          transactions,
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: 1 }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).resolves.toBeUndefined();
      });
    });

    describe('Block Height Validation', () => {
      test('should allow first block with height 1', async () => {
        mockRequest.body = {
          height: 1,
          id: crypto.createHash('sha256').update('1tx1').digest('hex'),
          transactions: [
            {
              id: 'tx1',
              inputs: [],
              outputs: [{ address: 'addr1', value: 10 }],
            },
          ],
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: null }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).resolves.toBeUndefined();
      });

      test('should reject first block with height > 1', async () => {
        mockRequest.body = {
          height: 2,
          id: crypto.createHash('sha256').update('2tx1').digest('hex'),
          transactions: [
            {
              id: 'tx1',
              inputs: [],
              outputs: [{ address: 'addr1', value: 10 }],
            },
          ],
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: null }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).rejects.toThrow('Invalid block height');
      });

      test('should allow consecutive block height', async () => {
        mockRequest.body = {
          height: 3,
          id: crypto.createHash('sha256').update('3tx1').digest('hex'),
          transactions: [
            {
              id: 'tx1',
              inputs: [],
              outputs: [{ address: 'addr1', value: 10 }],
            },
          ],
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: 2 }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).resolves.toBeUndefined();
      });

      test('should reject non-genesis block with no transactions', async () => {
        mockRequest.body = {
          height: 2,
          id: crypto.createHash('sha256').update('2').digest('hex'),
          transactions: [],
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: 1 }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).rejects.toThrow('Transactions are required for non-coinbase blocks');
      });

      test('should reject non-consecutive block height', async () => {
        mockRequest.body = {
          height: 5,
          id: crypto.createHash('sha256').update('5tx1').digest('hex'),
          transactions: [
            {
              id: 'tx1',
              inputs: [],
              outputs: [{ address: 'addr1', value: 10 }],
            },
          ],
        };

        mockSelect.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: 2 }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).rejects.toThrow('Invalid block height');
      });

      test('should reject block height less than current height', async () => {
        mockRequest.body = {
          height: 1,
          id: crypto.createHash('sha256').update('1tx1').digest('hex'),
          transactions: [
            {
              id: 'tx1',
              inputs: [],
              outputs: [{ address: 'addr1', value: 10 }],
            },
          ],
        };

        mockSelect.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: 3 }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).rejects.toThrow('Invalid block height');
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty transactions array', async () => {
        mockRequest.body = {
          height: 1,
          id: crypto.createHash('sha256').update('1').digest('hex'),
          transactions: [],
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: null }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).resolves.toBeUndefined();
      });

      test('should handle transactions with no inputs or outputs', async () => {
        mockRequest.body = {
          height: 1,
          id: crypto.createHash('sha256').update('1tx1').digest('hex'),
          transactions: [{ id: 'tx1', inputs: [], outputs: [] }],
        };

        mockDb.select.mockReturnValue({
          from: mock(() => ({
            limit: mock(() => Promise.resolve([{ recentHeight: null }])),
          })),
        });

        await expect(
          blockValidator?.validateBlock(mockRequest.body)
        ).resolves.toBeUndefined();
      });
    });
  });

  describe('validate if transaction are spent', () => {
    beforeEach(() => {
      mockWhere = mock(() => Promise.resolve([] as any[]));
      mockFrom = mock(() => ({ where: mockWhere }));
      mockSelect = mock(() => ({ from: mockFrom }));
      mockDb = { select: mockSelect } as any;

      mockRepository = new BlockRepository(mockDb);
      blockValidator = new BlockValidator(mockRepository);
    });

    test('should handle empty transactions array', async () => {
      const transactions: InputRequestBody[] = [];

      await expect(
        blockValidator?.validateIfTransactionAreSpent(transactions)
      ).resolves.toBeUndefined();
    });

    test('should throw error for transaction IDs that already exist', async () => {
      const transactions: InputRequestBody[] = [{ txId: 'tx1', index: 0 }];

      mockWhere.mockImplementation(() =>
        Promise.resolve([
          {
            txId: 'tx1',
            index: 0,
            spentAtHeight: 1,
            spentByTransactionId: 'tx2',
          },
        ])
      );

      await expect(
        blockValidator?.validateIfTransactionAreSpent(transactions)
      ).rejects.toThrow(
        'The inputs with transaction and index pairs (tx1, 0) have already been spent'
      );
    });

    test('should resolve when transaction are not spent', async () => {
      const transactions: InputRequestBody[] = [{ txId: 'tx1', index: 0 }];

      await expect(
        blockValidator?.validateIfTransactionAreSpent(transactions)
      ).resolves.toBeUndefined();
    });
  });
});
