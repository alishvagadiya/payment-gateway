import { pool } from "../dbConnect.js";
import { logger } from "../utils/loggers.js";

export class Transaction {
  async processTransaction(requestId:string ,source_account_id: string,destination_account_id: string,amount: number) {
    const client = await pool.connect();

    logger.info('processing transaction', {requestId,source_account_id,destination_account_id,amount});

    try {
      logger.debug('Beginning db transaction', {requestId,source_account_id,destination_account_id,amount});
      await client.query('BEGIN');

      logger.debug('Acquiring lock on source and destination account ', {requestId,source_account_id,destination_account_id,amount});
      const accountLockQuery = 'SELECT account_id, balance, created_at FROM accounts WHERE account_id IN ($1, $2) ORDER BY created_at ASC FOR UPDATE'
      
      const accountLockResult = await client.query(accountLockQuery,[source_account_id, destination_account_id]);
      if(accountLockResult.rows.length !== 2){
        const accFound = accountLockResult.rows.map(r => r.account_id);
        const missAcc = [source_account_id,destination_account_id].filter(acc=> !accFound.includes(acc));
        logger.warn('Account not found during transaction', {requestId, missAcc});
        throw new Error(`Account(s) -> ${missAcc.join(', ')} not found.`);
      }

      logger.debug('Acquiring lock on source and destination account on basis of oldest first', {
        requestId,
        first: accountLockResult.rows[0],
        second: accountLockResult.rows[1],
        source_account_id,
        destination_account_id
      });
      const sourceBalance = source_account_id === accountLockResult.rows[0].account_id
        ? accountLockResult.rows[0].balance
        : accountLockResult.rows[1].balance ;
      
      logger.debug('Accounts locked', {requestId,source_account_id,destination_account_id,amount});
      if(sourceBalance < amount){
        logger.warn('Insufficient balance for transaction', {requestId,source_account_id,destination_account_id,amount,sourceBalance,});
        throw new Error(`Source account ${source_account_id} having insufficient balance.`);
      }
      logger.debug('updating source account with debit ', {requestId,source_account_id,destination_account_id,amount});
      await client.query('UPDATE accounts SET balance = balance - $1 where account_id = $2',[amount.toString(), source_account_id]);
      logger.debug('updating destination account with credit', {requestId,source_account_id,destination_account_id,amount});
      await client.query('UPDATE accounts SET balance = balance + $1 where account_id = $2',[amount.toString(),destination_account_id]);

      logger.debug('record transaction', {requestId,source_account_id,destination_account_id,amount});
      const txQuery = `INSERT INTO transactions(source_account_id,destination_account_id,amount) VALUES($1,$2,$3) RETURNING transaction_id,source_account_id,destination_account_id,amount,amount,created_at`;

      const txResult = await client.query(txQuery,[source_account_id,destination_account_id,amount.toString()]);

      logger.debug('Transaction committed successfully', { requestId, transaction: txResult.rows[0] });
      await client.query('COMMIT');
      logger.info('Transaction committed successfully',{ requestId, transactionId: txResult.rows[0], source_account_id, destination_account_id, amount})
      return {
        ...txResult.rows[0]
      }
    } catch (error) {
      logger.error('Error processing transaction', {
        requestId,
        source_account_id,
        destination_account_id,
        amount,
        error,
      });
      throw new Error(`Error processing transaction: ${error}`, )
    } finally {
      client.release();
    }
  }
}

export const TransactionService = new Transaction();