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

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/', new ManageProbationTeamsHandler(probationTeamsService))
  route('/confirmation', new ConfirmationHandler(probationTeamsService))

  return router
}
