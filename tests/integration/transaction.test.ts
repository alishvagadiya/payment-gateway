import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/dbConnect.js';

const SRC = 'TEST-TX-INT-001';
const DST = 'TEST-TX-INT-002';

beforeAll(async () => {
  await pool.query('DELETE FROM transactions WHERE source_account_id LIKE $1', ['TEST-TX-INT-%']);
  await pool.query('DELETE FROM accounts WHERE account_id LIKE $1', ['TEST-TX-INT-%']);
  await pool.query('INSERT INTO accounts(account_id, balance) VALUES($1, $2)', [SRC, 5000]);
  await pool.query('INSERT INTO accounts(account_id, balance) VALUES($1, $2)', [DST, 1000]);
});

afterAll(async () => {
  await pool.query('DELETE FROM transactions WHERE source_account_id LIKE $1', ['TEST-TX-INT-%']);
  await pool.query('DELETE FROM accounts WHERE account_id LIKE $1', ['TEST-TX-INT-%']);
  await pool.end();
});

describe('POST /transactions', () => {
  it('should process transaction and return 201', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ source_account_id: SRC, destination_account_id: DST, amount: 100 });

    expect(res.status).toBe(201);
    expect(res.body.source_account_id).toBe(SRC);
    expect(res.body.destination_account_id).toBe(DST);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ source_account_id: SRC });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_REQUEST');
  });

  it('should return 400 for negative amount', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ source_account_id: SRC, destination_account_id: DST, amount: -50 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for same account transfer', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ source_account_id: SRC, destination_account_id: SRC, amount: 100 });

    expect(res.status).toBe(400);
  });

  it('should return 500 for insufficient balance', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ source_account_id: SRC, destination_account_id: DST, amount: 999999 });

    expect(res.status).toBe(500);
  });

  it('should return 500 for non-existent account', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ source_account_id: 'GHOST-001', destination_account_id: DST, amount: 10 });

    expect(res.status).toBe(500);
  });
});
