import type { Request, Response, NextFunction } from "express";
import { resJson, idGenerator } from "./utils/utils.js";
import { logger } from './utils/loggers.js'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId;

  logger.error('Unhandled application error', {
    requestId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  resJson(res, 500, {
    status_code: 500,
    error_code: 'INTERNAL_ERROR',
    error_message: err.message || 'Internal server error'
  })
  
}

export function handleRequest(req: Request, res: Response, next: NextFunction){
  const startTime = Date.now();
  const requestId = idGenerator('req');

  (req as any).requestId = requestId;

  logger.info('Incoming request',{
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
  });

  res.on('finish',() => {
    logger.info('Request Completed',{
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime
    });
  });

  next();
}