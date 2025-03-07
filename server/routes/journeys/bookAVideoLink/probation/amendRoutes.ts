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
import config from '../../../../config'
import BookingDetailsHandler from './handlers/bookingDetailsHandler'
import BookingAvailabilityHandler from './handlers/bookingAvailabilityHandler'

export default function AmendRoutes({
  auditService,
  probationBookingService,
  probationTeamsService,
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
    const { bookingId, date, startTime, bookingStatus } = req.session.journey.bookAProbationMeeting
    const bookingDate = parseISO(date)
    const bookingTime = parseISO(startTime)

    if (!videoLinkService.bookingIsAmendable(bookingDate, bookingTime, bookingStatus)) {
      req.session.journey.bookAProbationMeeting = null
      return res.redirect(`/probation/view-booking/${bookingId}`)
    }
    return next()
  })

  if (config.featureToggles.enhancedProbationJourneyEnabled) {
    route(
      `/video-link-booking`,
      new BookingDetailsHandler(probationTeamsService, prisonerService, referenceDataService),
    )
    route(`/video-link-booking/availability`, new BookingAvailabilityHandler(probationBookingService))
  } else {
    route(
      '/video-link-booking',
      new NewBookingHandler(
        probationTeamsService,
        prisonService,
        prisonerService,
        referenceDataService,
        videoLinkService,
      ),
    )
    route('/video-link-booking/not-available', new BookingNotAvailableHandler(probationBookingService))
  }

  route('/video-link-booking/comments', new CommentsHandler())
  route(
    '/video-link-booking/check-booking',
    new CheckBookingHandler(
      probationBookingService,
      probationTeamsService,
      prisonService,
      referenceDataService,
      videoLinkService,
    ),
  )

  return router
}
