import { Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import HomeHandler from './handlers/home'
import { PageHandler } from './handlers/interfaces/pageHandler'
import logPageViewMiddleware from '../middleware/logPageViewMiddleware'

export default function routes({ auditService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))

  const homeHandler = new HomeHandler()

  get('/', homeHandler)

  return router
}
