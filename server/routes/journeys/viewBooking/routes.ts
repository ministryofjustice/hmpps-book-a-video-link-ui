import { Router } from 'express'
import type { Services } from '../../../services'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ViewDailyBookingsHandler from './handlers/viewDailyBookingsHandler'
import ViewBookingHandler from './handlers/viewBookingHandler'
import DownloadCsvHandler from './handlers/downloadCsvHandler'

export default function Index({
  auditService,
  courtsService,
  probationTeamsService,
  prisonService,
  prisonerService,
  videoLinkService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), handler.GET) &&
    handler.POST &&
    router.post(path, validationMiddleware(handler.BODY), handler.POST)

  route('/', new ViewDailyBookingsHandler(courtsService, probationTeamsService, videoLinkService))
  route('/download-csv', new DownloadCsvHandler(courtsService, probationTeamsService, videoLinkService))
  route('/:bookingId', new ViewBookingHandler(videoLinkService, prisonerService, prisonService))

  return router
}
