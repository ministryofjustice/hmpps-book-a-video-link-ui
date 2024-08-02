import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import AdminHandler from './handlers/adminHandler'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ExtractByHearingDateHandler from './handlers/extractByHearingDateHandler'
import ExtractByBookingDateHandler from './handlers/extractByBookingDateHandler'

export default function Index({ auditService, videoLinkService }: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  route('/', new AdminHandler())
  route('/extract-by-booking-date', new ExtractByBookingDateHandler(videoLinkService))
  route('/extract-by-hearing-date', new ExtractByHearingDateHandler(videoLinkService))

  return router
}
