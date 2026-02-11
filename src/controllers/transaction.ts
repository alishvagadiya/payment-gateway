import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils.js";
import { TransactionService } from "../services/transaction.js"

export async function processTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {source_account_id, destination_account_id, amount} = req.body;
    if(!source_account_id || !destination_account_id || amount === undefined){
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'source_account_id, destination_account_id, and amount is required'
      })
      return;
    }

    if (amount < 0) {
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'Amount must be more than zero.'
      })
      return;
    }

    if (source_account_id === destination_account_id) {
      resJson(res, 400, {
        status_codes: 400,
        error_code: 'INVALID_REQUEST',
        error_message: 'Same Account Transfer.'
      })
      return;
    }

    const dbResponse = await TransactionService.processTransaction(source_account_id,destination_account_id,amount);

    resJson(res, 201, {
        ...dbResponse
    })
  } catch (err){
    next(err)
  }
}