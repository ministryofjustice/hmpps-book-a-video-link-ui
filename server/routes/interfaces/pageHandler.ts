import { NextFunction, Request, Response } from 'express'
import Page from '../enumerator/page'

type RequestBody = { new (): object }

export interface PageHandler {
  PAGE_NAME: Page
  GET(req: Request, res: Response, next?: NextFunction): Promise<void>
  POST?(req: Request, res: Response, next?: NextFunction): Promise<void>
  BODY?: RequestBody
}
