import { Router } from 'express'

import createError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ManageCourtsHandler from './handlers/manageCourtsHandler'

export default function routes({ auditService, courtsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))
  const post = (path: string | string[], handler: PageHandler) =>
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  // The following routes are only accessible to court users
  router.use((req, res, next) => {
    return res.locals.user.isCourtUser ? next() : next(createError(404, 'Not found'))
  })

  const manageCourtsHandler = new ManageCourtsHandler(courtsService)
  // const confirmationHandler = new HomeHandler()

  get('/', manageCourtsHandler)
  post('/', manageCourtsHandler)

  return router
}
