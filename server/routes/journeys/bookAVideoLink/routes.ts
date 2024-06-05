import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import NewBookingHandler from './handlers/newBookingHandler'
import PrisonerSearchHandler from './handlers/prisonerSearchHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import CheckBookingHandler from './handlers/checkBookingHandler'
import PrisonerSearchResultsHandler from './handlers/prisonerSearchResultsHandler'
import ConfirmationHandler from './handlers/confirmationHandler'

export default function Routes({
  auditService,
  courtsService,
  probationTeamsService,
  prisonService,
  prisonerService,
  videoLinkService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/prisoner-search', new PrisonerSearchHandler(prisonService))
  route('/prisoner-search/results', new PrisonerSearchResultsHandler())
  route(
    '/:prisonerNumber/add-video-link-booking',
    new NewBookingHandler(courtsService, probationTeamsService, prisonService, prisonerService, videoLinkService),
  )
  route(
    '/:prisonerNumber/add-video-link-booking/check-booking',
    new CheckBookingHandler(courtsService, probationTeamsService, prisonService, videoLinkService),
  )
  route('/:prisonerNumber/add-video-link-booking/confirmation/:bookingId', new ConfirmationHandler())

  return router
}
