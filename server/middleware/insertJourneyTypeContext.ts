import type { NextFunction, Request, Response } from 'express'

export default function insertJourneyTypeContext(type: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.routeContext = { ...req.routeContext, type }
    return next()
  }
}
