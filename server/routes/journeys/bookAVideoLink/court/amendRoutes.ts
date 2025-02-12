import { Router } from 'express'
import { parseISO } from 'date-fns'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import NewBookingHandler from './handlers/newBookingHandler'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import CheckBookingHandler from './handlers/checkBookingHandler'
import ConfirmationHandler from './handlers/confirmationHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'
import CommentsHandler from './handlers/commentsHandler'

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
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/video-link-booking/confirmation', new ConfirmationHandler(videoLinkService, prisonerService, prisonService))

  router.use((req, res, next) => {
    const { bookingId, date, preHearingStartTime, startTime, bookingStatus } = req.session.journey.bookAVideoLink
    const bookingDate = parseISO(date)
    const bookingTime = parseISO(preHearingStartTime || startTime)

    if (!videoLinkService.bookingIsAmendable(bookingDate, bookingTime, bookingStatus)) {
      req.session.journey.bookAVideoLink = null
      return res.redirect(`/court/view-booking/${bookingId}`)
    }
    return next()
  })

  route(
    '/video-link-booking',
    new NewBookingHandler(courtsService, prisonService, prisonerService, referenceDataService, videoLinkService),
  )
  route('/video-link-booking/not-available', new BookingNotAvailableHandler(courtBookingService))
  route('/video-link-booking/comments', new CommentsHandler())
  route(
    '/video-link-booking/check-booking',
    new CheckBookingHandler(courtBookingService, courtsService, prisonService, referenceDataService, videoLinkService),
  )

  return router
}
