import { beforeEach, describe, expect, mock, test } from 'bun:test';
import crypto from 'crypto';
import type { PostBlockBody } from '../../../../../src/routes/blockRoutes/schema/postBlock';
import { validateBlock } from '../../../../../src/routes/blockRoutes/validators/postBlockValidator';
// Mock the database operations
const mockDb = {
  select: mock(() => ({
    from: mock(() => ({
      limit: mock(() =>
        Promise.resolve([{ recentHeight: null as number | null }])
      ),
    })),
  })),
};

const mockRequest = {
  server: { db: mockDb },
  body: {} as PostBlockBody,
} as any;

describe('validateBlock', () => {
  beforeEach(() => {
    mockDb.select.mockClear();
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

      await expect(validateBlock(mockRequest)).resolves.toBeUndefined();
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

      await expect(validateBlock(mockRequest)).rejects.toThrow(
        'Invalid block id'
      );
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

      await expect(validateBlock(mockRequest)).resolves.toBeUndefined();
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

      await expect(validateBlock(mockRequest)).resolves.toBeUndefined();
    });

    test('should reject first block with height > 1', async () => {
      mockRequest.body = {
        height: 2,
        id: crypto.createHash('sha256').update('2tx1').digest('hex'),
        transactions: [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        ],
      };

      mockDb.select.mockReturnValue({
        from: mock(() => ({
          limit: mock(() => Promise.resolve([{ recentHeight: null }])),
        })),
      });

      await expect(validateBlock(mockRequest)).rejects.toThrow(
        'Invalid block height'
      );
    });

    test('should allow consecutive block height', async () => {
      mockRequest.body = {
        height: 3,
        id: crypto.createHash('sha256').update('3tx1').digest('hex'),
        transactions: [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        ],
      };

      mockDb.select.mockReturnValue({
        from: mock(() => ({
          limit: mock(() => Promise.resolve([{ recentHeight: 2 }])),
        })),
      });

      await expect(validateBlock(mockRequest)).resolves.toBeUndefined();
    });

    test('should reject non-consecutive block height', async () => {
      mockRequest.body = {
        height: 5,
        id: crypto.createHash('sha256').update('5tx1').digest('hex'),
        transactions: [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        ],
      };

      mockDb.select.mockReturnValue({
        from: mock(() => ({
          limit: mock(() => Promise.resolve([{ recentHeight: 2 }])),
        })),
      });

      await expect(validateBlock(mockRequest)).rejects.toThrow(
        'Invalid block height'
      );
    });

    test('should reject block height less than current height', async () => {
      mockRequest.body = {
        height: 1,
        id: crypto.createHash('sha256').update('1tx1').digest('hex'),
        transactions: [
          { id: 'tx1', inputs: [], outputs: [{ address: 'addr1', value: 10 }] },
        ],
      };

      mockDb.select.mockReturnValue({
        from: mock(() => ({
          limit: mock(() => Promise.resolve([{ recentHeight: 3 }])),
        })),
      });

      await expect(validateBlock(mockRequest)).rejects.toThrow(
        'Invalid block height'
      );
    });
  });
});
