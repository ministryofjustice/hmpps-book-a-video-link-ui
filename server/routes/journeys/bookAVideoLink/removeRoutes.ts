import { Router } from 'express'
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

  // TODO: Restrict access to edit journey for bookings which should not be cancellable (e.g. already in the past)

  route('/confirm', new ConfirmCancelHandler(videoLinkService))
  route('/confirmation', new BookingCancelledHandler(videoLinkService, prisonerService))

  return router
}
