import { Router } from 'express'

import createError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ManageProbationTeamsHandler from './handlers/manageProbationTeamsHandler'
import ConfirmationHandler from './handlers/confirmationHandler'

export default function routes({ auditService, probationTeamsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))
  const post = (path: string | string[], handler: PageHandler) =>
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  // The following routes are only accessible to probation users
  router.use((req, res, next) => {
    return res.locals.user.isProbationUser ? next() : next(createError(404, 'Not found'))
  })

  const manageProbationAreasHandler = new ManageProbationTeamsHandler(probationTeamsService)
  const confirmationHandler = new ConfirmationHandler(probationTeamsService)

  get('/', manageProbationAreasHandler)
  post('/', manageProbationAreasHandler)
  get('/confirmation', confirmationHandler)

  return router
}
