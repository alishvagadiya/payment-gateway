import { pool } from "../dbConnect.js";
import { logger } from "../utils/loggers.js";

export class Transaction {
  async processTransaction(requestId:string ,source_account_id: string,destination_account_id: string,amount: number) {
    const client = await pool.connect();

    logger.info('processing transaction', {requestId,source_account_id,destination_account_id,amount});

    try {
      logger.debug('Beginning db transaction', {requestId,source_account_id,destination_account_id,amount});
      await client.query('BEGIN');

      logger.debug('Acquiring lock on source account ', {requestId,source_account_id,destination_account_id,amount});
      const sourceLockQuery = 'SELECT balance FROM accounts WHERE account_id = $1 FOR UPDATE'
      const sourceLockResult = await client.query(sourceLockQuery,[source_account_id]);
      if(sourceLockResult.rows.length === 0){
        logger.warn('Source account not found during transaction', {requestId,source_account_id});
        throw new Error(`Source account ${source_account_id} not found.`);
      }
      const sourceBalance = sourceLockResult.rows[0].balance;
      
      logger.debug('Acquiring lock on destination account ', {requestId,source_account_id,destination_account_id,amount});
      const destinationLockQuery = 'SELECT balance FROM accounts WHERE account_id = $1 FOR UPDATE'
      const destinationLockResult = await client.query(destinationLockQuery,[destination_account_id]);
      if(destinationLockResult.rows.length === 0){
        logger.warn('Destination account not found during transaction', {requestId,destination_account_id,});
        throw new Error(`destination account ${destination_account_id} not found.`);
      }
      
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