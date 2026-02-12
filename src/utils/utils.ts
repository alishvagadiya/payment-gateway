import type { Response } from "express"

export function resJson(res: Response, statusCode: number, data: any) {
  res.status(statusCode).send(JSON.stringify(data))
}

export function idGenerator(prefix:string): string{
  const timeStamp = Date.now();
  const random = Math.random().toString(36).substring(2,9);
  return `${prefix}-${timeStamp}-${random}`
}