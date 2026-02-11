import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils.js";
import { AccountService } from "../services/account.js"
export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {initial_balance, account_number} = req.body ?? {};
    if(initial_balance <= 0){
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'initial_balance is required'
      })
      return;
    }

    const dbResponse = await AccountService.createAccount(account_number,BigInt(initial_balance));

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
  resJson(res, 200, {
    status_code: 200,
    account_number: '100',
    balance: 1000,
    message: 'Account created successfully'
  })
}