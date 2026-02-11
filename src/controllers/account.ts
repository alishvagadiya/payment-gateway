import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils.js";
import { AccountService } from "../services/account.js"

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {initial_balance, account_id} = req.body ?? {};
    if(initial_balance <= 0){
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'initial_balance is required'
      })
      return;
    }

    const dbResponse = await AccountService.createAccount(account_id,initial_balance);

    resJson(res, 201, {
      data: {
        ...dbResponse
      },
      message: 'Account created successfully'
    })
  } catch (err){
    next(err)
  }
}

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { account_id} = req.params ?? {};
    if(!account_id || typeof account_id !== 'string'){
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'account_id is required'
      })
      return;
    }

    const dbResponse = await AccountService.getAccountBalance(account_id);

    resJson(res, 200, {
      ...dbResponse
    })
  } catch (err){
    next(err)
  }
}