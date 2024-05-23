import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import HomeHandler from './handlers/homeHandler'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'

export default function Index({ auditService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))

  const homeHandler = new HomeHandler()

  get('/', homeHandler)

  return router
}
