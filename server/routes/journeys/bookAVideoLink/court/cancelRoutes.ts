import { Router } from 'express'
import { parseISO } from 'date-fns'
import type { Services } from '../../../../services'
import { PageHandler } from '../../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import ConfirmCancelHandler from './handlers/confirmCancelHandler'
import BookingCancelledHandler from './handlers/bookingCancelledHandler'

export default function CancelRoutes({ auditService, prisonerService, videoLinkService }: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), handler.GET) &&
    handler.POST &&
    router.post(path, validationMiddleware(handler.BODY), handler.POST)

  route('/confirmation', new BookingCancelledHandler(videoLinkService, prisonerService))

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

  route('/confirm', new ConfirmCancelHandler(videoLinkService))

  return router
}
