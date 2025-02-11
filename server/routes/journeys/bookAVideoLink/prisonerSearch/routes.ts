import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import PrisonerSearchHandler from './handlers/prisonerSearchHandler'
import PrisonerSearchResultsHandler from './handlers/prisonerSearchResultsHandler'
import PrisonerNotListedHandler from './handlers/prisonerNotListedHandler'

export default function Routes({ auditService, prisonService, prisonerService }: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/search', new PrisonerSearchHandler(prisonService))

  // Prisoner search journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.journey.prisonerSearch) return res.redirect('/')
    return next()
  })

  route('/results', new PrisonerSearchResultsHandler(prisonerService, prisonService))
  route('/prisoner-not-listed', new PrisonerNotListedHandler())

  return router
}
