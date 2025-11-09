import type { DatabaseClient } from '@/@types/fastify';
import type { PostBlockBody } from '@/routes/blockRoutes/schema/postBlock';
import { BlockService } from '@/routes/blockRoutes/services/blockService';
import { BadRequestError } from '@/utils/appError';
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { mockGenesisBlock, mockRegularBlock } from 'spec/unit/unitTestConstants';

describe('BlockService', () => {
  let mockRepository: any;
  let mockValidator: any;
  let mockTransactionProcessor: any;
  let blockService: BlockService;
  let mockDb: DatabaseClient;

  beforeEach(() => {
    mockRepository = {
      saveBlock: mock(() => Promise.resolve()),
      getBlock: mock(() => Promise.resolve({ id: 'test', height: 1 })),
      rollbackBlock: mock(() => Promise.resolve()),
    };
    mockValidator = {
      validateBlock: mock(() => Promise.resolve()),
      validateTransactionId: mock(() => Promise.resolve()),
      validateOutputBalance: mock(() => Promise.resolve([])),
      validateIfTransactionAreSpent: mock(() => Promise.resolve()),
    };
    mockTransactionProcessor = {
      processOutput: mock(() =>
        Promise.resolve({
          currentTransactionRow: [{ id: 'tx-id', blockHeight: 1 }],
          currentOutputRows: [
            {
              txId: 'tx-id',
              index: 0,
              address: 'addr',
              amount: '50',
              blockHeight: 1,
            },
          ],
        })
      ),
      processSpentOutput: mock(() =>
        Promise.resolve({
          currentSpentOutputRows: [],
          currentBalanceDeltas: new Map(),
        })
      ),
      formatBalanceDeltaTableRows: mock(() => [
        { address: 'addr', balanceDelta: '50', blockHeight: 1 },
      ]),
    };

    // Mock database
    mockDb = {} as any;

    blockService = new BlockService(mockDb);

    // Override dependencies with mocks
    (blockService as any).repository = mockRepository;
    (blockService as any).validator = mockValidator;
    (blockService as any).transactionProcessor = mockTransactionProcessor;
  });

  describe('createBlock', () => {
    test('should create genesis block successfully', async () => {
      mockValidator.validateOutputBalance = mock(() => Promise.resolve([]));
      await blockService.createBlock(mockGenesisBlock);
      expect(mockValidator.validateBlock).toHaveBeenCalledWith(
        mockGenesisBlock
      );
      expect(mockValidator.validateTransactionId).toHaveBeenCalledWith(
        mockGenesisBlock.transactions
      );
      expect(mockTransactionProcessor.processOutput).toHaveBeenCalledWith(
        mockGenesisBlock.transactions[0],
        1
      );
      expect(mockRepository.saveBlock).toHaveBeenCalled();
    });

    test('should create regular transaction block successfully', async () => {
      await blockService.createBlock(mockRegularBlock);
      expect(mockValidator.validateBlock).toHaveBeenCalledWith(
        mockRegularBlock
      );
      expect(mockValidator.validateTransactionId).toHaveBeenCalledWith(
        mockRegularBlock.transactions
      );
      expect(mockValidator.validateOutputBalance).toHaveBeenCalledWith(
        mockRegularBlock.transactions[0]
      );
      expect(mockValidator.validateIfTransactionAreSpent).toHaveBeenCalledWith(
        mockRegularBlock.transactions[0].inputs
      );
      expect(mockTransactionProcessor.processOutput).toHaveBeenCalledWith(
        mockRegularBlock.transactions[0],
        2
      );
      expect(mockRepository.saveBlock).toHaveBeenCalled();
    });

    test('should handle mixed genesis and regular transactions', async () => {
      const mixedBlock: PostBlockBody = {
        height: 3,
        id: 'mixed-block',
        transactions: [
          {
            id: 'genesis-tx',
            inputs: [],
            outputs: [{ address: 'addr1', value: 50 }],
          },
          {
            id: 'regular-tx',
            inputs: [{ txId: 'genesis-tx', index: 0 }],
            outputs: [{ address: 'addr2', value: 30 }],
          },
        ],
      };

      mockValidator.validateOutputBalance
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { txId: 'genesis-tx', index: 0, address: 'addr1', amount: '50' },
        ]);

      await blockService.createBlock(mixedBlock);
      expect(mockRepository.saveBlock).toHaveBeenCalled();
      expect(mockTransactionProcessor.processOutput).toHaveBeenCalledTimes(2);
    });

    test('should correctly pass balance deltas to formatter', async () => {
      const blockWithOutputs: PostBlockBody = {
        height: 1,
        id: 'output-block',
        transactions: [
          {
            id: 'output-tx',
            inputs: [],
            outputs: [
              { address: 'addr1', value: 100 },
              { address: 'addr2', value: 200 },
            ],
          },
        ],
      };

      await blockService.createBlock(blockWithOutputs);
      expect(
        mockTransactionProcessor.formatBalanceDeltaTableRows
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          balanceDeltaTableRows: expect.any(Map),
          height: 1,
        })
      );
    });

    test('should throw error when block validation fails', async () => {
      mockValidator.validateBlock = mock(() =>
        Promise.reject(new BadRequestError('Invalid block'))
      );
      await expect(blockService.createBlock(mockGenesisBlock)).rejects.toThrow(
        'Invalid block'
      );
      expect(mockRepository.saveBlock).not.toHaveBeenCalled();
    });

    test('should throw error when output balance validation fails', async () => {
      mockValidator.validateOutputBalance = mock(() =>
        Promise.reject(new BadRequestError('Insufficient balance'))
      );

      await expect(
        blockService.createBlock(mockRegularBlock)
      ).rejects.toThrow();
      expect(mockRepository.saveBlock).not.toHaveBeenCalled();
    });

    test('should throw error when transaction id validation fails', async () => {
      mockValidator.validateTransactionId = mock(() =>
        Promise.reject(new BadRequestError('Invalid transaction id'))
      );

      await expect(blockService.createBlock(mockRegularBlock)).rejects.toThrow(
        'Invalid transaction id'
      );
    });

    test('should throw error when input transaction are spent', async () => {
      mockValidator.validateIfTransactionAreSpent = mock(() =>
        Promise.reject(new BadRequestError('Invalid transaction are spent'))
      );

      await expect(blockService.createBlock(mockRegularBlock)).rejects.toThrow(
        'Invalid transaction are spent'
      );
    });

    test('should handle repository save errors', async () => {
      mockRepository.saveBlock = mock(() =>
        Promise.reject(new Error('Database save failed'))
      );

      await expect(blockService.createBlock(mockGenesisBlock)).rejects.toThrow(
        'Database save failed'
      );
    });
  });

  describe('rollbackBlock', () => {
    test('should rollback block successfully', async () => {
      await blockService.rollbackBlock(5);
      expect(mockRepository.getBlock).toHaveBeenCalledWith(5);
      expect(mockRepository.rollbackBlock).toHaveBeenCalledWith(5);
    });

    test('should throw error for non-existent block', async () => {
      mockRepository.getBlock = mock(() => Promise.resolve(undefined));

      await expect(blockService.rollbackBlock(999)).rejects.toThrow(
        'Block not found'
      );
      expect(mockRepository.rollbackBlock).not.toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockRepository.rollbackBlock = mock(() =>
        Promise.reject(new Error('Database error'))
      );
      await expect(blockService.rollbackBlock(3)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
