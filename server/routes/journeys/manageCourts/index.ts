import { Router } from 'express'

import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ManageCourtsHandler from './handlers/manageCourtsHandler'

export default function routes({ auditService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))
  const post = (path: string | string[], handler: PageHandler) =>
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  const manageCourtsHandler = new ManageCourtsHandler()
  // const confirmationHandler = new HomeHandler()

  get('/', manageCourtsHandler)
  post('/', manageCourtsHandler)

  return router
}
