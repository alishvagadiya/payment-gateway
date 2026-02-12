import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../../src/services/account.js', () => ({
  AccountService: {
    createAccount: vi.fn(),
    getAccountBalance: vi.fn(),
  },
}));

vi.mock('../../../src/utils/loggers.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createAccount, getBalance } from '../../../src/controllers/account.js';
import { AccountService } from '../../../src/services/account.js';

const mockCreateAccount = vi.mocked(AccountService.createAccount);
const mockGetBalance = vi.mocked(AccountService.getAccountBalance);

function mockReqRes(body = {}, params = {}) {
  const req = { body, params, requestId: 'req-test' } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createAccount controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 201 on success', async () => {
    const mockData = { account_id: 'ACC001', balance: '1000.0000000', created_at: new Date() };
    mockCreateAccount.mockResolvedValueOnce(mockData);

    const { req, res, next } = mockReqRes({ account_id: 'ACC001', initial_balance: 1000 });
    await createAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when initial_balance is 0 or negative', async () => {
    const { req, res, next } = mockReqRes({ account_id: 'ACC001', initial_balance: 0 });
    await createAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockCreateAccount).not.toHaveBeenCalled();
  });

  it('should return 400 when account_id is missing', async () => {
    const { req, res, next } = mockReqRes({ initial_balance: 1000 });
    await createAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockCreateAccount).not.toHaveBeenCalled();
  });

  it('should call next on service error', async () => {
    mockCreateAccount.mockRejectedValueOnce(new Error('DB error'));

    const { req, res, next } = mockReqRes({ account_id: 'ACC001', initial_balance: 1000 });
    await createAccount(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('getBalance controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return 200 with balance', async () => {
    const mockData = { account_id: 'ACC001', balance: '1000.0000000', created_at: new Date() };
    mockGetBalance.mockResolvedValueOnce(mockData);

    const { req, res, next } = mockReqRes({}, { account_id: 'ACC001' });
    await getBalance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next on service error', async () => {
    mockGetBalance.mockRejectedValueOnce(new Error('not found'));

    const { req, res, next } = mockReqRes({}, { account_id: 'ACC001' });
    await getBalance(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
