import { pool } from "../dbConnect.js";

export class Account {
  async createAccount(account_id:string,initial_balance: number) {
    if (initial_balance < 0) {
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

      return {
        account_id: row.account_id,
        balance: row.balance,
        created_at: row.created_at
      };
    } catch (error) {
      throw new Error(`Error creating account: ${error}`, )
    }
  }

  async getAccountBalance(account_id:string) {
    const query = `
      SELECT account_id, balance, created_at FROM accounts
      WHERE account_id = $1;
    `;
    try {
      const result = await pool.query(query,[account_id]);
      const row = result.rows[0];

      return {
        account_id: row.account_id,
        balance: row.balance,
        created_at: row.created_at
      };
    } catch (error) {
      throw new Error(`Error getting account balance: ${error}`, )
    }
  }
}

export const AccountService = new Account();