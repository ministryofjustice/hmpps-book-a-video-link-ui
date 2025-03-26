import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import PrisonerDetailsHandler from './handlers/prisonerDetailsHandler'
import DeprecatedNewBookingHandler from './handlers/deprecatedNewBookingHandler'
import CheckBookingHandler from './handlers/checkBookingHandler'
import DeprecatedBookingNotAvailableHandler from './handlers/deprecatedBookingNotAvailableHandler'
import BookingRequestedHandler from './handlers/bookingRequestedHandler'
import config from '../../../../config'
import BookingDetailsHandler from './handlers/bookingDetailsHandler'

export default function RequestRoutes({
  auditService,
  courtBookingService,
  courtsService,
  prisonService,
  prisonerService,
  referenceDataService,
  videoLinkService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/prisoner/prisoner-details', new PrisonerDetailsHandler(prisonService))
  route(`/prisoner/video-link-booking/confirmation`, new BookingRequestedHandler())

  // Book a court hearing journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.journey.bookACourtHearing) return res.redirect('/')
    return next()
  })

  if (config.featureToggles.alteredCourtJourneyEnabled) {
    route(
      `/prisoner/video-link-booking`,
      new BookingDetailsHandler(courtsService, prisonerService, referenceDataService),
    )
  } else {
    route(
      `/prisoner/video-link-booking`,
      new DeprecatedNewBookingHandler(
        courtsService,
        prisonService,
        prisonerService,
        referenceDataService,
        videoLinkService,
      ),
    )
    route(`/prisoner/video-link-booking/not-available`, new DeprecatedBookingNotAvailableHandler(courtBookingService))
  }

  route(
    `/prisoner/video-link-booking/check-booking`,
    new CheckBookingHandler(courtBookingService, courtsService, prisonService, referenceDataService, videoLinkService),
  )

  return router
}
