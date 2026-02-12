import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils/utils.js";
import { TransactionService } from "../services/transaction.js"
import { logger } from "../utils/loggers.js";
export async function processTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = (req as any).requestId;
  try {
    const {source_account_id, destination_account_id, amount} = req.body;
    logger.info('Processing transaction', {requestId, source_account_id, destination_account_id, amount})
    if(!source_account_id || !destination_account_id || amount === undefined){
      logger.warn('Transaction processing failed - invalid request', {requestId, source_account_id, destination_account_id, amount})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'source_account_id, destination_account_id, and amount is required'
      })
      return;
    }

    if (amount <= 0) {
      logger.warn('Transaction processing failed - invalid amount', {requestId, source_account_id, destination_account_id, amount})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'Amount must be more than zero.'
      })
      return;
    }

    if (source_account_id === destination_account_id) {
      logger.warn('Transaction processing failed - same account transfer', {requestId, source_account_id, destination_account_id, amount})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'Same Account Transfer.'
      })
      return;
    }

    const dbResponse = await TransactionService.processTransaction(requestId,source_account_id,destination_account_id,amount);

    logger.info('Transaction processed successfully', {requestId, ...dbResponse})
    resJson(res, 201, {
        ...dbResponse
    })
  } catch (error){
    logger.error('Transaction processing failed', {requestId, error})
    next(error)
  }
}