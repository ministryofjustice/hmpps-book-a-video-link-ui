import { Router } from 'express'
import createError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import AdminHandler from './handlers/adminHandler'
import { PageHandler } from '../../interfaces/pageHandler'
import logPageViewMiddleware from '../../../middleware/logPageViewMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ExtractByHearingDateHandler from './handlers/extractByHearingDateHandler'
import ExtractByBookingDateHandler from './handlers/extractByBookingDateHandler'
import ViewPrisonsHandler from './handlers/viewPrisonsHandler'
import ViewPrisonLocationsHandler from './handlers/viewPrisonLocationsHandler'
import ViewPrisonRoomHandler from './handlers/viewPrisonRoomHandler'
import DeleteRoomScheduleHandler from './handlers/deleteRoomScheduleHandler'
import AddRoomScheduleHandler from './handlers/addRoomScheduleHandler'
import EditRoomScheduleHandler from './handlers/editRoomScheduleHandler'

export default function Index({
  auditService,
  videoLinkService,
  prisonService,
  courtsService,
  probationTeamsService,
  adminService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const route = (path: string | string[], handler: PageHandler) =>
    router.get(path, logPageViewMiddleware(auditService, handler), asyncMiddleware(handler.GET)) &&
    router.post(path, validationMiddleware(handler.BODY), asyncMiddleware(handler.POST))

  router.use((req, res, next) => {
    return res.locals.user.isAdminUser ? next() : next(createError(404, 'Not found'))
  })

  route('/', new AdminHandler())
  route('/extract-by-booking-date', new ExtractByBookingDateHandler(videoLinkService))
  route('/extract-by-hearing-date', new ExtractByHearingDateHandler(videoLinkService))
  route('/view-prison-list', new ViewPrisonsHandler(prisonService))
  route('/view-prison-locations/:prisonCode', new ViewPrisonLocationsHandler(prisonService))
  route(
    '/view-prison-room/:prisonCode/:dpsLocationId',
    new ViewPrisonRoomHandler(prisonService, courtsService, probationTeamsService, adminService),
  )
  route(
    '/delete-schedule/:prisonCode/:dpsLocationId/:scheduleId',
    new DeleteRoomScheduleHandler(prisonService, courtsService, probationTeamsService, adminService),
  )
  route(
    '/add-schedule/:prisonCode/:dpsLocationId',
    new AddRoomScheduleHandler(prisonService, courtsService, probationTeamsService, adminService),
  )
  route(
    '/edit-schedule/:prisonCode/:dpsLocationId/:scheduleId',
    new EditRoomScheduleHandler(prisonService, courtsService, probationTeamsService, adminService),
  )
  return router
}
