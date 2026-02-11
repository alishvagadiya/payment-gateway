import type { Response } from "express"

export function resJson(res: Response, statusCode: number, data: any) {
  res.status(statusCode).send(JSON.stringify(data))
}