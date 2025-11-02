import { getAddressBalanceController } from '@/routes/blockRoutes/controllers';
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { FastifyRequest } from 'fastify';

// Mock the reply object
const mockReply = {
  send: mock((data: any) => data),
  status: mock((code: number) => code),
} as any;

describe('getAddressBalanceController', () => {
  let mockRequest: FastifyRequest<{ Params: { address: string } }>;
  let mockDb = null as any;
  let mockWhere = null as any;
  let mockFrom = null as any;
  let mockSelect = null as any;

  beforeEach(() => {
    mockReply.send.mockClear();
    mockReply.status.mockClear();

    mockWhere = mock(() => Promise.resolve([] as any[]));
    mockFrom = mock(() => ({ where: mockWhere }));
    mockSelect = mock(() => ({ from: mockFrom }));
    mockDb = { select: mockSelect } as any;

    mockRequest = {
      server: { db: mockDb },
      params: { address: '' },
    } as FastifyRequest<{ Params: { address: string } }>;
  });

  describe('Balance Calculation', () => {
    test('should return correct balance for address with unspent outputs', async () => {
      const address = 'test-address-1';
      const mockBalance = { balance: '150.75' };

      mockRequest.params.address = address;

      mockWhere.mockImplementation(() => Promise.resolve([mockBalance]));

      await getAddressBalanceController(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({ balance: '150.75' });
    });

    test('should return zero balance for address with no outputs', async () => {
      const address = 'empty-address';

      mockRequest.params.address = address;

      mockWhere.mockImplementation(() => Promise.resolve([{ balance: 0 }]));

      await getAddressBalanceController(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({ balance: 0 });
    });

    test('should return zero balance for address with only spent outputs', async () => {
      const address = 'spent-only-address';
      const mockBalance = { balance: null };

      mockRequest.params.address = address;

      mockWhere.mockImplementation(() => Promise.resolve([mockBalance]));

      await getAddressBalanceController(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({ balance: 0 });
    });

    test('should handle address with multiple unspent outputs', async () => {
      const address = 'multi-output-address';
      const mockBalance = { balance: '1000.00' };

      mockRequest.params.address = address;

      mockWhere.mockImplementation(() => Promise.resolve([mockBalance]));

      await getAddressBalanceController(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({ balance: '1000.00' });
    });

    test('should handle balance with decimal places', async () => {
      const address = 'decimal-address';
      const mockBalance = { balance: '123.456789' };

      mockRequest.params.address = address;

      mockWhere.mockImplementation(() => Promise.resolve([mockBalance]));

      await getAddressBalanceController(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({ balance: '123.456789' });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty address string', async () => {
      const address = '';
      const mockBalance = { balance: '0' };

      mockRequest.params.address = address;
      mockWhere.mockImplementation(() => Promise.resolve([mockBalance]));

      await expect(
        getAddressBalanceController(mockRequest, mockReply)
      ).rejects.toThrow('Address is required');
    });
  });
});
