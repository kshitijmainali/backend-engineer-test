import type { DatabaseClient } from '@/@types/fastify';
import BalanceRepository from '@/routes/blockRoutes/repositories/balanceRepository';
import BalanceService from '@/routes/blockRoutes/services/balanceService';
import { BadRequestError } from '@/utils/appError';
import { beforeEach, describe, expect, mock, test } from 'bun:test';

let mockDb: DatabaseClient;
let mockRepository: BalanceRepository;
let balanceService: BalanceService;
let mockGetAddressBalance: ReturnType<typeof mock>;

describe('BalanceService', () => {
  beforeEach(() => {
    mockGetAddressBalance = mock(() => Promise.resolve(0));
    mockDb = {} as any;
    mockRepository = {
      getAddressBalance: mockGetAddressBalance,
    } as any;

    balanceService = new BalanceService(mockDb);
    (balanceService as any).repository = mockRepository;
  });

  describe('getAddressBalance', () => {
    test('should throw BadRequestError for null, empty address', async () => {
      const emptyAddress = '';
      await expect(
        balanceService.getAddressBalance(emptyAddress)
      ).rejects.toThrow(BadRequestError);
      await expect(
        balanceService.getAddressBalance(emptyAddress)
      ).rejects.toThrow('Address is required');
      expect(mockGetAddressBalance).not.toHaveBeenCalled();
    });

    test('should propagate repository errors', async () => {
      const address = 'error-address';
      const repositoryError = new Error('Database connection failed');
      mockGetAddressBalance.mockRejectedValue(repositoryError);

      await expect(balanceService.getAddressBalance(address)).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockRepository.getAddressBalance).toHaveBeenCalledWith(address);
    });

    test('should return balance from repository', async () => {
      const address = 'test-address-123';
      const expectedBalance = 150.75;
      mockGetAddressBalance.mockResolvedValue(expectedBalance);

      const result = await balanceService.getAddressBalance(address);

      expect(result).toBe(expectedBalance);
      expect(mockRepository.getAddressBalance).toHaveBeenCalledWith(address);
    });
  });
});
