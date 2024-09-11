import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import PrisonerNotListedHandler from './handlers/prisonerNotListedHandler'
import PrisonerDetailsHandler from './handlers/prisonerDetailsHandler'
import NewBookingHandler from './handlers/newBookingHandler'
import CheckBookingHandler from './handlers/checkBookingHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'
import BookingRequestedHandler from './handlers/bookingRequestedHandler'

export default function RequestRoutes({
  auditService,
  prisonService,
  courtsService,
  probationTeamsService,
  prisonerService,
  videoLinkService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route(`/prisoner/video-link-booking/confirmation`, new BookingRequestedHandler())

  // Book a video link journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.journey.bookAVideoLink) return res.redirect('/')
    return next()
  })

  route('/prisoner-search/prisoner-not-listed', new PrisonerNotListedHandler())
  route('/prisoner/prisoner-details', new PrisonerDetailsHandler(prisonService))
  route(
    '/prisoner/video-link-booking',
    new NewBookingHandler(courtsService, probationTeamsService, prisonService, prisonerService, videoLinkService),
  )
  route(
    `/prisoner/video-link-booking/check-booking`,
    new CheckBookingHandler(courtsService, probationTeamsService, prisonService, videoLinkService),
  )
  route(`/prisoner/video-link-booking/not-available`, new BookingNotAvailableHandler(videoLinkService))

  return router
}
