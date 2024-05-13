import { Router } from 'express'

import createError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ManageProbationAreasHandler from './handlers/manageProbationAreasHandler'

export default function routes({ auditService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))
  const post = (path: string | string[], handler: PageHandler) =>
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  // The following routes are only accessible to probation users
  router.use((req, res, next) => {
    return res.locals.user.isProbationUser ? next() : next(createError(404, 'Not found'))
  })

  const manageProbationAreasHandler = new ManageProbationAreasHandler()
  // const confirmationHandler = new HomeHandler()

  get('/', manageProbationAreasHandler)
  post('/', manageProbationAreasHandler)

  return router
}
