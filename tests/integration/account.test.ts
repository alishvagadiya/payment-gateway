import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { pool } from '../../src/dbConnect.js';

const TEST_ACC_1 = 'TEST-ACC-INT-001';
const TEST_ACC_2 = 'TEST-ACC-INT-002';

beforeAll(async () => {
  await pool.query('DELETE FROM accounts WHERE account_id LIKE $1', ['TEST-ACC-INT-%']);
});

afterAll(async () => {
  await pool.query('DELETE FROM accounts WHERE account_id LIKE $1', ['TEST-ACC-INT-%']);
  await pool.end();
});

describe('POST /account', () => {
  it('should create account and return 201', async () => {
    const res = await request(app)
      .post('/account')
      .send({ account_id: TEST_ACC_1, initial_balance: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.data.account_id).toBe(TEST_ACC_1);
    expect(res.body.message).toBe('Account created successfully');
  });

  it('should return 400 for missing account_id', async () => {
    const res = await request(app)
      .post('/account')
      .send({ initial_balance: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_REQUEST');
  });

  it('should return 400 for zero or negative balance', async () => {
    const res = await request(app)
      .post('/account')
      .send({ account_id: TEST_ACC_2, initial_balance: 0 });

    expect(res.status).toBe(400);
  });

  it('should return 500 for duplicate account_id', async () => {
    const res = await request(app)
      .post('/account')
      .send({ account_id: TEST_ACC_1, initial_balance: 1000 });

    expect(res.status).toBe(500);
  });
});

describe('GET /account/:account_id', () => {
  it('should return balance for existing account', async () => {
    const res = await request(app).get(`/account/${TEST_ACC_1}`);

    expect(res.status).toBe(200);
    expect(res.body.account_id).toBe(TEST_ACC_1);
  });
});
