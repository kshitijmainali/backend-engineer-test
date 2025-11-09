import type { OutputTableRow } from '@/db/schema';
import type { TransactionRequestBody } from '@/routes/blockRoutes/schema/postBlock';
import { TransactionProcessor } from '@/routes/blockRoutes/services/transactionProcessor';
import { beforeEach, describe, expect, test } from 'bun:test';

const mockHeight = 5;

describe('TransactionProcessor', () => {
  let processor: TransactionProcessor;

  beforeEach(() => {
    processor = new TransactionProcessor();
  });

  describe('processOutput', () => {
    test('should process transaction with single output', async () => {
      const transaction: TransactionRequestBody = {
        id: 'tx-123',
        inputs: [],
        outputs: [{ address: 'address-1', value: 100 }],
      };

      const result = await processor.processOutput(transaction, mockHeight);

      expect(result).toEqual({
        currentTransactionRow: [{ id: 'tx-123', blockHeight: mockHeight }],
        currentOutputRows: [
          {
            txId: 'tx-123',
            index: 0,
            address: 'address-1',
            amount: '100',
            blockHeight: mockHeight,
          },
        ],
      });
    });

    test('should process transaction with multiple outputs', async () => {
      const transaction: TransactionRequestBody = {
        id: 'tx-456',
        inputs: [],
        outputs: [
          { address: 'address-1', value: 50 },
          { address: 'address-2', value: 30 },
          { address: 'address-3', value: 20 },
        ],
      };

      const result = await processor.processOutput(transaction, mockHeight);
      expect(result.currentTransactionRow).toEqual([
        { id: 'tx-456', blockHeight: mockHeight },
      ]);
      expect(result.currentOutputRows).toHaveLength(3);
      expect(result.currentOutputRows).toEqual([
        {
          txId: 'tx-456',
          index: 0,
          address: 'address-1',
          amount: '50',
          blockHeight: mockHeight,
        },
        {
          txId: 'tx-456',
          index: 1,
          address: 'address-2',
          amount: '30',
          blockHeight: mockHeight,
        },
        {
          txId: 'tx-456',
          index: 2,
          address: 'address-3',
          amount: '20',
          blockHeight: mockHeight,
        },
      ]);
    });

    test('should handle transaction with no outputs', async () => {
      const transaction: TransactionRequestBody = {
        id: 'tx-empty',
        inputs: [],
        outputs: [],
      };
      const result = await processor.processOutput(transaction, mockHeight);
      expect(result).toEqual({
        currentTransactionRow: [{ id: 'tx-empty', blockHeight: mockHeight }],
        currentOutputRows: [],
      });
    });

    test('should handle decimal values correctly', async () => {
      const transaction: TransactionRequestBody = {
        id: 'tx-decimal',
        inputs: [],
        outputs: [{ address: 'address-decimal', value: 123.456 }],
      };
      const result = await processor.processOutput(transaction, mockHeight);

      expect(result.currentOutputRows[0].amount).toBe('123.456');
    });
  });

  describe('processSpentOutput', () => {
    test('should process single spent output', () => {
      const existingOutputs: OutputTableRow[] = [
        {
          id: 1,
          txId: 'prev-tx-1',
          index: 0,
          address: 'previous-address',
          amount: '100',
          blockHeight: 1,
          createdAt: '2023-01-01T00:00:00Z',
        },
      ];
      const transactionId = 'new-tx-1';

      const result = processor.processSpentOutput(
        existingOutputs,
        mockHeight,
        transactionId
      );

      expect(result).toEqual({
        currentSpentOutputRows: [
          {
            txId: 'prev-tx-1',
            index: 0,
            spentAtHeight: mockHeight,
            spentByTransactionId: 'new-tx-1',
          },
        ],
        currentBalanceDeltas: new Map([['previous-address', -100]]),
      });
    });

    test('should process multiple spent outputs', () => {
      const existingOutputs: OutputTableRow[] = [
        {
          id: 1,
          txId: 'prev-tx-1',
          index: 0,
          address: 'address-1',
          amount: '50',
          blockHeight: 1,
          createdAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          txId: 'prev-tx-2',
          index: 1,
          address: 'address-2',
          amount: '75',
          blockHeight: 2,
          createdAt: '2023-01-01T00:00:00Z',
        },
      ];
      const transactionId = 'new-tx-multi';

      const result = processor.processSpentOutput(
        existingOutputs,
        mockHeight,
        transactionId
      );

      expect(result.currentSpentOutputRows).toHaveLength(2);
      expect(result.currentSpentOutputRows).toEqual([
        {
          txId: 'prev-tx-1',
          index: 0,
          spentAtHeight: mockHeight,
          spentByTransactionId: 'new-tx-multi',
        },
        {
          txId: 'prev-tx-2',
          index: 1,
          spentAtHeight: mockHeight,
          spentByTransactionId: 'new-tx-multi',
        },
      ]);

      expect(result.currentBalanceDeltas.get('address-1')).toBe(-50);
      expect(result.currentBalanceDeltas.get('address-2')).toBe(-75);
    });

    test('should handle empty existing outputs array', () => {
      const existingOutputs: OutputTableRow[] = [];
      const height = 3;
      const transactionId = 'empty-tx';

      const result = processor.processSpentOutput(
        existingOutputs,
        height,
        transactionId
      );

      expect(result).toEqual({
        currentSpentOutputRows: [],
        currentBalanceDeltas: new Map(),
      });
    });

    test('should accumulate balance deltas for same address', () => {
      const existingOutputs: OutputTableRow[] = [
        {
          id: 1,
          txId: 'prev-tx-1',
          index: 0,
          address: 'same-address',
          amount: '30',
          blockHeight: 1,
          createdAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          txId: 'prev-tx-2',
          index: 0,
          address: 'same-address',
          amount: '20',
          blockHeight: 2,
          createdAt: '2023-01-01T00:00:00Z',
        },
      ];
      const height = 5;
      const transactionId = 'accumulator-tx';

      const result = processor.processSpentOutput(
        existingOutputs,
        height,
        transactionId
      );

      expect(result.currentBalanceDeltas.get('same-address')).toBe(-50);
    });
  });

  describe('formatBalanceDeltaTableRows', () => {
    test('should format single balance delta entry', () => {
      const balanceDeltaMap = new Map([['address-1', 100]]);
      const result = processor.formatBalanceDeltaTableRows({
        balanceDeltaTableRows: balanceDeltaMap,
        height: mockHeight,
      });
      expect(result).toEqual([
        {
          address: 'address-1',
          balanceDelta: '100',
          blockHeight: mockHeight,
        },
      ]);
    });

    test('should format multiple balance delta entries', () => {
      const balanceDeltaMap = new Map([
        ['address-1', 50],
        ['address-2', -30],
        ['address-3', 25.5],
      ]);
      const result = processor.formatBalanceDeltaTableRows({
        balanceDeltaTableRows: balanceDeltaMap,
        height: mockHeight,
      });
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { address: 'address-1', balanceDelta: '50', blockHeight: mockHeight },
        { address: 'address-2', balanceDelta: '-30', blockHeight: mockHeight },
        { address: 'address-3', balanceDelta: '25.5', blockHeight: mockHeight },
      ]);
    });

    test('should handle empty balance delta map', () => {
      const balanceDeltaMap = new Map();
      const result = processor.formatBalanceDeltaTableRows({
        balanceDeltaTableRows: balanceDeltaMap,
        height: mockHeight,
      });
      expect(result).toEqual([]);
    });
  });
});
