import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import NewBookingHandler from './handlers/newBookingHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import CheckBookingHandler from './handlers/checkBookingHandler'
import ConfirmationHandler from './handlers/confirmationHandler'
import BookingNotAvailableHandler from './handlers/bookingNotAvailableHandler'

export default function EditRoutes({
  auditService,
  courtsService,
  probationTeamsService,
  prisonService,
  prisonerService,
  videoLinkService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route(
    '/add-video-link-booking',
    new NewBookingHandler(courtsService, probationTeamsService, prisonService, prisonerService, videoLinkService),
  )
  route(
    '/add-video-link-booking/check-booking',
    new CheckBookingHandler(courtsService, probationTeamsService, prisonService, videoLinkService),
  )
  route('/add-video-link-booking/not-available', new BookingNotAvailableHandler(videoLinkService))
  route(
    '/add-video-link-booking/confirmation',
    new ConfirmationHandler(videoLinkService, prisonerService, prisonService),
  )

  return router
}
