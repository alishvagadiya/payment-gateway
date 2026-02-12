import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils/utils.js";
import { TransactionService } from "../services/transaction.js"
import { transactionQueue } from "../queue/transaction-queue.js"
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

export async function processTransactionAsync(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = (req as any).requestId;
  try {
    const {source_account_id, destination_account_id, amount} = req.body;
    logger.info('Processing transaction async', {requestId, source_account_id, destination_account_id, amount})
    if(!source_account_id || !destination_account_id || amount === undefined){
      logger.warn('Transaction processing  async failed - invalid request', {requestId, source_account_id, destination_account_id, amount})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'source_account_id, destination_account_id, and amount is required'
      })
      return;
    }

    if (amount <= 0) {
      logger.warn('Transaction processing async failed - invalid amount', {requestId, source_account_id, destination_account_id, amount})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'Amount must be more than zero.'
      })
      return;
    }

    if (source_account_id === destination_account_id) {
      logger.warn('Transaction processing async failed - same account transfer', {requestId, source_account_id, destination_account_id, amount})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'Same Account Transfer.'
      })
      return;
    }

    const jobId = transactionQueue.addInQueue({
      source: source_account_id,
      dest: destination_account_id,
      amount: amount,
      requestId: requestId
    });

    logger.info('Transaction queued successfully', {requestId, jobId, source_account_id, destination_account_id, amount})
    resJson(res, 202, {
        jobId,
        status: 'Processing',
    })
  } catch (error){
    logger.error('Transaction processing async failed', {requestId, error})
    next(error)
  }
}

export async function getTransactionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = (req as any).requestId;
  const { jobId } = req.params;

  if (!jobId || typeof jobId !== 'string') {
    logger.warn('Transaction job not found - missing jobId', { requestId, jobId });
    resJson(res, 404, {
      status_codes: 404,
      error_code: 'NOT_FOUND',
      error_message: 'job not found or still queued'
    });
    return;
  }
  logger.info('checking transaction status', { requestId, jobId});
  const result = transactionQueue.getTransactionStatus(jobId);
  if(!result) {
    logger.warn('Transaction job not found', { requestId, jobId})
    resJson(res, 404,{
      status_codes: 404,
      error_code: 'NOT_FOUND',
      error_message: 'job not found or still queued'
    })
    return;
  }

  if (result.status === 'PROCESSING') {
    logger.info('transaction still processing',{requestId,jobId, originalRequestId: result.requestId})

    resJson(res, 200, {
      request_id: result.requestId,
      status: 'PROCESSING',
      queue_position: transactionQueue.getQueueSize()
    })
    return;
  }

  if (result.status === 'SUCCESS') {
    logger.info('transaction completed successfully',{requestId,jobId, originalRequestId: result.requestId, transactionId: result.data.id })

    resJson(res, 200, {
      request_id: result.requestId,
      status: 'SUCCESS',
      ...result.data
    })
    return;
  }

  logger.warn('transaction failed', { requestId, jobId, originalRequestId: result.requestId, error: result.error})
  resJson(res, 400,{
    status: 'FAILED',
    request_id: result.requestId,
    error: result.error,
    error_message: 'transaction failed'
  })
  return;
}
