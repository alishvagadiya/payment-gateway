import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock('../../../src/dbConnect.js', () => ({
  pool: { connect: vi.fn() },
}));

vi.mock('../../../src/utils/loggers.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { pool } from '../../../src/dbConnect.js';
import { Transaction } from '../../../src/services/transaction.js';

const mockConnect = vi.mocked(pool.connect);

describe('TransactionService', () => {
  let service: Transaction;

  beforeEach(() => {
    service = new Transaction();
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient as any);
  });

  describe('processTransaction', () => {
    it('should process transaction successfully', async () => {
      const srcRow = { account_id: 'ACC001', balance: '5000.0000000', created_at: new Date('2024-01-01') };
      const dstRow = { account_id: 'ACC002', balance: '1000.0000000', created_at: new Date('2024-01-02') };
      const txRow = { transaction_id: 1, source_account_id: 'ACC001', destination_account_id: 'ACC002', amount: '100.0000000', created_at: new Date() };

      mockClient.query
        .mockResolvedValueOnce({} as any)                                        // BEGIN
        .mockResolvedValueOnce({ rows: [srcRow, dstRow], rowCount: 2 } as any)  // account lock
        .mockResolvedValueOnce({} as any)                                        // debit
        .mockResolvedValueOnce({} as any)                                        // credit
        .mockResolvedValueOnce({ rows: [txRow], rowCount: 1 } as any)           // INSERT tx
        .mockResolvedValueOnce({} as any);                                       // COMMIT

      const result = await service.processTransaction('req-1', 'ACC001', 'ACC002', 100);

      expect(result.transaction_id).toBe(1);
      expect(result.source_account_id).toBe('ACC001');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error for insufficient balance', async () => {
      const srcRow = { account_id: 'ACC001', balance: '50.0000000', created_at: new Date('2024-01-01') };
      const dstRow = { account_id: 'ACC002', balance: '1000.0000000', created_at: new Date('2024-01-02') };

      mockClient.query
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({ rows: [srcRow, dstRow], rowCount: 2 } as any);

      await expect(service.processTransaction('req-1', 'ACC001', 'ACC002', 500))
        .rejects.toThrow('insufficient balance');

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when account not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({} as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(service.processTransaction('req-1', 'ACC001', 'ACC999', 100))
        .rejects.toThrow('not found');

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(service.processTransaction('req-1', 'ACC001', 'ACC002', 100))
        .rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
