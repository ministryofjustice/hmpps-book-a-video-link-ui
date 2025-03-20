import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import NewBookingHandler from './handlers/newBookingHandler'
import CheckBookingHandler from './handlers/checkBookingHandler'
import ConfirmationHandler from './handlers/confirmationHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'
import config from '../../../../config'
import V2NewBookingHandler from './handlers/v2NewBookingHandler'
import V2SelectRoomsHandler from './handlers/v2SelectRoomsHandler'
import V2NoRoomsHandler from './handlers/v2NoRoomsHandler'

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
    /**
     * The 3-stage journey to enter date and time and which hearings are required, and then the 2nd stage
     * to select from lists of available rooms returned from the API DateTimeAvailability check. If any
     * room list is empty, a 3rd stage presents a no-rooms-available form to prompt for a change of date and time.
     */
    route(
      `${basePath}/video-link-booking`,
      new V2NewBookingHandler(courtsService, prisonerService, referenceDataService),
    )
    route(
      `${basePath}/video-link-booking/select-rooms`,
      new V2SelectRoomsHandler(courtsService, courtBookingService, prisonerService),
    )
    route(`${basePath}/video-link-booking/no-rooms`, new V2NoRoomsHandler(courtsService, prisonerService))
  } else {
    route(
      `${basePath}/video-link-booking`,
      new NewBookingHandler(courtsService, prisonService, prisonerService, referenceDataService, videoLinkService),
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

  route(
    `${basePath}/video-link-booking/check-booking`,
    new CheckBookingHandler(courtBookingService, courtsService, prisonService, referenceDataService, videoLinkService),
  )

  /**
   * The old availability check is offered if no bookings are available when the feature switch is off as
   * this does not take room decoration into account.
   */
  if (!config.featureToggles.alteredCourtJourneyEnabled) {
    route(`${basePath}/video-link-booking/not-available`, new BookingNotAvailableHandler(courtBookingService))
  }

  return router
}
