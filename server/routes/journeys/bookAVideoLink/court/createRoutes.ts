import { Router } from 'express'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import CheckBookingHandler from './handlers/checkBookingHandler'
import ConfirmationHandler from './handlers/confirmationHandler'
import BookingDetailsHandler from './handlers/bookingDetailsHandler'
import SelectRoomsHandler from './handlers/selectRoomsHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'
import validatePrisonerNumber from '../middleware/validatePrisonerNumber'

export default function CreateRoutes({
  auditService,
  courtBookingService,
  courtsService,
  prisonService,
  prisonerService,
  referenceDataService,
  videoLinkService,
}: Services): Router {
  const basePath = '/:prisonerNumber'
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), validatePrisonerNumber(), handler.GET) &&
    handler.POST &&
    router.post(path, validatePrisonerNumber(), validationMiddleware(handler.BODY), handler.POST)

  route(
    `${basePath}/video-link-booking`,
    new BookingDetailsHandler(courtsService, prisonerService, referenceDataService),
  )

  route(
    `${basePath}/video-link-booking/confirmation/:bookingId`,
    new ConfirmationHandler(videoLinkService, prisonerService, prisonService),
  )

  // Book a court hearing journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.journey.bookACourtHearing) return res.redirect('/')
    return next()
  })

  route(`${basePath}/video-link-booking/select-rooms`, new SelectRoomsHandler(courtsService, courtBookingService))
  route(`${basePath}/video-link-booking/not-available`, new BookingNotAvailableHandler(courtsService))
  route(
    `${basePath}/video-link-booking/check-booking`,
    new CheckBookingHandler(courtBookingService, courtsService, prisonService, referenceDataService, videoLinkService),
  )

  return router
}
