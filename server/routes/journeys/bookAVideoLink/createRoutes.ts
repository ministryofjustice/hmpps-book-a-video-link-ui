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
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'

export default function CreateRoutes({
  auditService,
  courtsService,
  probationTeamsService,
  prisonService,
  prisonerService,
  videoLinkService,
}: Services): Router {
  const basePath = '/:prisonerNumber([a-zA-Z][0-9]{4}[a-zA-Z]{2})'
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/prisoner-search', new PrisonerSearchHandler(prisonService))

  // Book a video link journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.journey.bookAVideoLink) return res.redirect('/')
    return next()
  })

  route('/prisoner-search/results', new PrisonerSearchResultsHandler(prisonerService, prisonService))
  route(
    `${basePath}/video-link-booking`,
    new NewBookingHandler(courtsService, probationTeamsService, prisonService, prisonerService, videoLinkService),
  )
  route(
    `${basePath}/video-link-booking/check-booking`,
    new CheckBookingHandler(courtsService, probationTeamsService, prisonService, videoLinkService),
  )
  route(`${basePath}/video-link-booking/not-available`, new BookingNotAvailableHandler(videoLinkService))
  route(
    `${basePath}/video-link-booking/confirmation/:bookingId`,
    new ConfirmationHandler(videoLinkService, prisonerService, prisonService),
  )

  return router
}
