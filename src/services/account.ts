import { pool } from "../dbConnect.js";
import { logger } from "../utils/loggers.js";
export class Account {
  async createAccount(requestId:string, account_id:string,initial_balance: number) {
    logger.info('Creating account', {requestId, account_id, initial_balance})
    if (initial_balance <= 0) {
      logger.warn('Account creation failed - invalid initial balance', {requestId, account_id, initial_balance})
      throw new Error('Initial Balance Cannot be negative.');
    }

    const query = `
      INSERT INTO accounts(account_id, balance) 
      VALUES ($1, $2)
      RETURNING account_id, balance, created_at
    `;
    try {
      const result = await pool.query(query,[account_id, initial_balance.toString()]);
      const row = result.rows[0];

      logger.info('Account created successfully', {requestId, ...row})
      return {
        account_id: row.account_id,
        balance: row.balance,
        created_at: row.created_at
      };
    } catch (error) {
      logger.error('Account creation failed', {requestId, error})
      throw new Error(`Error creating account: ${error}`, )
    }
  }

  async getAccountBalance(requestId:string, account_id:string) {
    logger.info('Getting account balance', {requestId, account_id})
    const query = `
      SELECT account_id, balance, created_at FROM accounts
      WHERE account_id = $1;
    `;
    try {
      const result = await pool.query(query,[account_id]);
      const row = result.rows[0];

      logger.info('Account Balance fetched', {requestId, ...row})
      return {
        account_id: row.account_id,
        balance: row.balance,
        created_at: row.created_at
      };
    } catch (error) {
      logger.error('Database error account balance fetch', {requestId, account_id, error})
      throw new Error(`Error getting account balance: ${error}`, )
    }
  }
}

export const AccountService = new Account();