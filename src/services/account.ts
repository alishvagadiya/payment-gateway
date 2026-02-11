import { pool } from "../dbConnect.js";

export class Account {
  async createAccount(account_number:string,initial_balance: bigint) {
    if (initial_balance < 0) {
      throw new Error('Initial Balance Cannot be negative.');
    }

    const query = `
      INSERT INTO accounts(account_number, balance) 
      VALUES ($1, $2)
      RETURNING account_number, balance, created_at
    `;
    try {
      const result = await pool.query(query,[account_number, initial_balance.toString()]);
      const row = result.rows[0];

      return {
        account_number: row.account_number,
        balance: row.balance,
        created_at: row.created_at
      };
    } catch (error) {
      throw new Error(`Error creating account: ${error}`, )
    }
  }
}

export const AccountService = new Account();