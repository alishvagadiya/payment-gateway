import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils/utils.js";
import { AccountService } from "../services/account.js"
import { logger } from "../utils/loggers.js";

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = (req as any).requestId;
  try {
    const {initial_balance, account_id} = req.body ?? {};

    logger.info('Creating account', {requestId, account_id, initial_balance})
    if(!account_id || typeof account_id !== 'string'){
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'account_id is required'
      })
      return;
    }

    if(initial_balance <= 0 || initial_balance === undefined || initial_balance === null){
      logger.warn('Account creation failed - invalid initial balance', {requestId, account_id, initial_balance})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'initial_balance is required'
      })
      return;
    }


    const dbResponse = await AccountService.createAccount(requestId, account_id,initial_balance);

    logger.info('Account created successfully', {requestId, ...dbResponse})
    resJson(res, 201, {
      data: {
        ...dbResponse
      },
      message: 'Account created successfully'
    })
  } catch (error){
    logger.error('Account creation failed', {requestId, error})
    next(error)
  }
}

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestId = (req as any).requestId;
  try {
    const { account_id } = req.params ?? {};
    logger.info('Account balance requested', {requestId, account_id})
    if(!account_id || typeof account_id !== 'string'){
      logger.warn('Account balance requested - invalid account id', {requestId, account_id})
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'account_id is required'
      })
      return;
    }

    const dbResponse = await AccountService.getAccountBalance(requestId, account_id);

    logger.info('Account balance retrieved', {requestId, ...dbResponse})
    resJson(res, 200, {
      ...dbResponse
    })
  } catch (error){
    logger.error('Account balance retrieval failed', {requestId, error})
    next(error)
  }
}