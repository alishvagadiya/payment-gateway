import type { Request, Response, NextFunction } from "express";
import { resJson } from "./utils.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);

  resJson(res, 500, {
    status_code: 500,
    error_code: 'INTERNAL_ERROR',
    error_message: err.message || 'Internal server error'
  })
  
}