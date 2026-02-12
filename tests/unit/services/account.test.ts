import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/dbConnect.js', () => ({
  pool: { query: vi.fn() },
}));

vi.mock('../../../src/utils/loggers.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { pool } from '../../../src/dbConnect.js';
import { Account } from '../../../src/services/account.js';

const mockQuery = vi.mocked(pool.query);

describe('AccountService', () => {
  let service: Account;

  beforeEach(() => {
    service = new Account();
    vi.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const mockRow = { account_id: 'ACC001', balance: '1000.0000000', created_at: new Date() };
      mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 } as any);

      const result = await service.createAccount('req-1', 'ACC001', 1000);

      expect(result.account_id).toBe('ACC001');
      expect(result.balance).toBe('1000.0000000');
      expect(mockQuery).toHaveBeenCalledOnce();
    });

    it('should throw error for negative balance', async () => {
      await expect(service.createAccount('req-1', 'ACC001', -100))
        .rejects.toThrow('Initial Balance Cannot be negative.');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should throw error for zero balance', async () => {
      await expect(service.createAccount('req-1', 'ACC001', 0))
        .rejects.toThrow('Initial Balance Cannot be negative.');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should throw on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('duplicate key'));

      await expect(service.createAccount('req-1', 'ACC001', 1000))
        .rejects.toThrow('Error creating account');
    });
  });

  describe('getAccountBalance', () => {
    it('should return account balance', async () => {
      const mockRow = { account_id: 'ACC001', balance: '1000.0000000', created_at: new Date() };
      mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 } as any);

      const result = await service.getAccountBalance('req-1', 'ACC001');

      expect(result.account_id).toBe('ACC001');
      expect(result.balance).toBe('1000.0000000');
    });

    it('should throw on DB error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection error'));

      await expect(service.getAccountBalance('req-1', 'ACC001'))
        .rejects.toThrow('Error getting account balance');
    });
  });
});
