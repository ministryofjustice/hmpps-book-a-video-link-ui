import { Router } from 'express'
import { parseISO } from 'date-fns'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import CheckBookingHandler from './handlers/checkBookingHandler'
import ConfirmationHandler from './handlers/confirmationHandler'
import CommentsHandler from './handlers/commentsHandler'
import SelectRoomsHandler from './handlers/selectRoomsHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'
import BookingDetailsHandler from './handlers/bookingDetailsHandler'

export default function AmendRoutes({
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
    router.get(path, logPageViewMiddleware(auditService, handler), handler.GET) &&
    handler.POST &&
    router.post(path, validationMiddleware(handler.BODY), handler.POST)

  route('/video-link-booking/confirmation', new ConfirmationHandler(videoLinkService, prisonerService, prisonService))

  router.use((req, res, next) => {
    const { bookingId, date, preHearingStartTime, startTime, bookingStatus } = req.session.journey.bookACourtHearing
    const bookingDate = parseISO(date)
    const bookingTime = parseISO(preHearingStartTime || startTime)

    if (!videoLinkService.bookingIsAmendable(bookingDate, bookingTime, bookingStatus)) {
      req.session.journey.bookACourtHearing = null
      return res.redirect(`/court/view-booking/${bookingId}`)
    }

    return next()
  })

  route('/video-link-booking', new BookingDetailsHandler(courtsService, prisonerService, referenceDataService))
  route(`/video-link-booking/select-rooms`, new SelectRoomsHandler(courtsService, courtBookingService))
  route(`/video-link-booking/not-available`, new BookingNotAvailableHandler(courtsService))
  route('/video-link-booking/comments', new CommentsHandler())
  route(
    '/video-link-booking/check-booking',
    new CheckBookingHandler(courtBookingService, courtsService, prisonService, referenceDataService, videoLinkService),
  )

  return router
}
