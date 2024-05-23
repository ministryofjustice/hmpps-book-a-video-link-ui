import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ManageProbationTeamsHandler from './handlers/manageProbationTeamsHandler'
import ConfirmationHandler from './handlers/confirmationHandler'

export default function Routes({ auditService, probationTeamsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET))
  const post = (path: string | string[], handler: PageHandler) =>
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  const manageProbationTeamsHandler = new ManageProbationTeamsHandler(probationTeamsService)
  const confirmationHandler = new ConfirmationHandler(probationTeamsService)

  get('/select-probation-teams', manageProbationTeamsHandler)
  post('/select-probation-teams', manageProbationTeamsHandler)
  get('/confirmation', confirmationHandler)

  return router
}
