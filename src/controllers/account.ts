import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils.js";

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  resJson(res, 201, {
    status_code: 201,
    message: 'Account created successfully'
  })
}

export async function getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  resJson(res, 200, {
    status_code: 200,
    account_number: '100',
    balance: 1000,
    message: 'Account created successfully'
  })
}