import type { Request, Response, NextFunction } from "express";
import { resJson } from "../utils.js";

export async function processTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  resJson(res, 200, {
    status_code: 20,
    message: 'Transaction successfully'
  })
}