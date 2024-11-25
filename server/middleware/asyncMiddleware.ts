import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { NotFound } from 'http-errors'

export default function asyncMiddleware(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (fn) Promise.resolve(fn(req, res, next)).catch(next)
    else next(new NotFound())
  }
}
