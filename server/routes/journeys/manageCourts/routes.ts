import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ManageCourtsHandler from './handlers/manageCourtsHandler'
import ConfirmationHandler from './handlers/confirmationHandler'

export default function Routes({ auditService, courtsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))
  const post = (path: string | string[], handler: PageHandler) =>
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  const manageCourtsHandler = new ManageCourtsHandler(courtsService)
  const confirmationHandler = new ConfirmationHandler(courtsService)

  get('/', manageCourtsHandler)
  post('/', manageCourtsHandler)
  get('/confirmation', confirmationHandler)

  return router
}
