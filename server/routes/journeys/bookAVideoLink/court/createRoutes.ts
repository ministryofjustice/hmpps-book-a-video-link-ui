import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import DeprecatedNewBookingHandler from './handlers/deprecatedNewBookingHandler'
import CheckBookingHandler from './handlers/checkBookingHandler'
import ConfirmationHandler from './handlers/confirmationHandler'
import DeprecatedBookingNotAvailableHandler from './handlers/deprecatedBookingNotAvailableHandler'
import config from '../../../../config'
import BookingDetailsHandler from './handlers/bookingDetailsHandler'
import SelectRoomsHandler from './handlers/selectRoomsHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'

export default function CreateRoutes({
  auditService,
  courtBookingService,
  courtsService,
  prisonService,
  prisonerService,
  referenceDataService,
  videoLinkService,
}: Services): Router {
  const basePath = '/:prisonerNumber([a-zA-Z][0-9]{4}[a-zA-Z]{2})'
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  if (config.featureToggles.alteredCourtJourneyEnabled) {
    route(
      `${basePath}/video-link-booking`,
      new BookingDetailsHandler(courtsService, prisonerService, referenceDataService),
    )
  } else {
    route(
      `${basePath}/video-link-booking`,
      new DeprecatedNewBookingHandler(
        courtsService,
        prisonService,
        prisonerService,
        referenceDataService,
        videoLinkService,
      ),
    )
  }

  route(
    `${basePath}/video-link-booking/confirmation/:bookingId`,
    new ConfirmationHandler(videoLinkService, prisonerService, prisonService),
  )

  // Book a court hearing journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.journey.bookACourtHearing) return res.redirect('/')
    return next()
  })

  if (config.featureToggles.alteredCourtJourneyEnabled) {
    route(
      `${basePath}/video-link-booking/select-rooms`,
      new SelectRoomsHandler(courtsService, courtBookingService, prisonerService),
    )
    route(
      `${basePath}/video-link-booking/not-available`,
      new BookingNotAvailableHandler(courtsService, prisonerService),
    )
  } else {
    route(`${basePath}/video-link-booking/not-available`, new DeprecatedBookingNotAvailableHandler(courtBookingService))
  }

  route(
    `${basePath}/video-link-booking/check-booking`,
    new CheckBookingHandler(courtBookingService, courtsService, prisonService, referenceDataService, videoLinkService),
  )

  return router
}
