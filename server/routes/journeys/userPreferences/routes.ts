import { Router } from 'express'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import UserPreferencesHandler from './handlers/userPreferencesHandler'
import ConfirmationHandler from './handlers/confirmationHandler'

export default function Index({ auditService, courtsService, probationTeamsService }: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/', new UserPreferencesHandler(courtsService, probationTeamsService))
  route('/confirmation', new ConfirmationHandler(courtsService, probationTeamsService))

  return router
}
