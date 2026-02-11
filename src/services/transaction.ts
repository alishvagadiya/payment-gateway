import { pool } from "../dbConnect.js";

export class Transaction {
  async processTransaction(source_account_id: string,destination_account_id: string,amount: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sourceLockQuery = 'SELECT balance FROM accounts WHERE account_id = $1 FOR UPDATE'
      const sourceLockResult = await client.query(sourceLockQuery,[source_account_id]);
      if(sourceLockResult.rows.length === 0){
        throw new Error(`Source account ${source_account_id} not found.`);
      }
      const sourceBalance = sourceLockResult.rows[0].balance;
      
      const destinationLockQuery = 'SELECT balance FROM accounts WHERE account_id = $1 FOR UPDATE'
      const destinationLockResult = await client.query(destinationLockQuery,[destination_account_id]);
      if(destinationLockResult.rows.length === 0){
        throw new Error(`destination account ${destination_account_id} not found.`);
      }
      
      if(sourceBalance < amount){
        throw new Error(`Source account ${source_account_id} having insufficient balance.`);
      }
      await client.query('UPDATE accounts SET balance = balance - $1 where account_id = $2',[amount.toString(), source_account_id]);
      await client.query('UPDATE accounts SET balance = balance + $1 where account_id = $2',[amount.toString(),destination_account_id]);

      const txQuery = `INSERT INTO transactions(source_account_id,destination_account_id,amount) VALUES($1,$2,$3) RETURNING transaction_id,source_account_id,destination_account_id,amount,amount,created_at`;

      const txResult = await client.query(txQuery,[source_account_id,destination_account_id,amount.toString()]);

      await client.query('COMMIT');
      return {
        ...txResult.rows[0]
      }
    } catch (error) {
      throw new Error(`Error processing transaction: ${error}`, )
    } finally {
      client.release();
    }
  }
}

export const TransactionService = new Transaction();