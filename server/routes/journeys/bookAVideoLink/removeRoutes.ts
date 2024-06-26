import { Router } from 'express'
import { parseISO } from 'date-fns'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ConfirmCancelHandler from './handlers/confirmCancelHandler'
import BookingCancelledHandler from './handlers/bookingCancelledHandler'

export default function RemoveRoutes({ auditService, prisonerService, videoLinkService }: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  router.use((req, res, next) => {
    const { bookingId, date, preHearingStartTime, startTime, bookingStatus } = req.session.journey.bookAVideoLink
    const bookingDate = parseISO(date)
    const bookingTime = parseISO(preHearingStartTime || startTime)

    if (!videoLinkService.bookingIsAmendable(bookingDate, bookingTime, bookingStatus)) {
      req.session.journey.bookAVideoLink = null
      return res.redirect(`/${req.params.type}/view-booking/${bookingId}`)
    }
    return next()
  })

  route('/confirm', new ConfirmCancelHandler(videoLinkService))
  route('/confirmation', new BookingCancelledHandler(videoLinkService, prisonerService))

  return router
}
