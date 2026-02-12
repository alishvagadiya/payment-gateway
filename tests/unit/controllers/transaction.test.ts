import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../../src/services/transaction.js', () => ({
  TransactionService: {
    processTransaction: vi.fn(),
  },
}));

vi.mock('../../../src/utils/loggers.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { processTransaction } from '../../../src/controllers/transaction.js';
import { TransactionService } from '../../../src/services/transaction.js';

const mockProcess = vi.mocked(TransactionService.processTransaction);

function mockReqRes(body = {}) {
  const req = { body, requestId: 'req-test' } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('processTransaction controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 201 on success', async () => {
    const mockData = { transaction_id: 1, source_account_id: 'ACC001', destination_account_id: 'ACC002', amount: '100.0000000', created_at: new Date() };
    mockProcess.mockResolvedValueOnce(mockData);

    const { req, res, next } = mockReqRes({ source_account_id: 'ACC001', destination_account_id: 'ACC002', amount: 100 });
    await processTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when fields are missing', async () => {
    const { req, res, next } = mockReqRes({ source_account_id: 'ACC001' });
    await processTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockProcess).not.toHaveBeenCalled();
  });

  it('should return 400 for negative amount', async () => {
    const { req, res, next } = mockReqRes({ source_account_id: 'ACC001', destination_account_id: 'ACC002', amount: -50 });
    await processTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockProcess).not.toHaveBeenCalled();
  });

  it('should return 400 for same account transfer', async () => {
    const { req, res, next } = mockReqRes({ source_account_id: 'ACC001', destination_account_id: 'ACC001', amount: 100 });
    await processTransaction(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockProcess).not.toHaveBeenCalled();
  });

  it('should call next on service error', async () => {
    mockProcess.mockRejectedValueOnce(new Error('insufficient balance'));

    const { req, res, next } = mockReqRes({ source_account_id: 'ACC001', destination_account_id: 'ACC002', amount: 100 });
    await processTransaction(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
