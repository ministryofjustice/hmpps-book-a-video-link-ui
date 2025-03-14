import { NextFunction, Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'
import AdminService from '../../../../services/adminService'
import ScheduleRequestBody from './shared/scheduleRequestBody'
import { Location } from '../../../../@types/bookAVideoLinkApi/types'
import { bodyToCreateScheduleRequest } from './shared/roomFunctions'

export default class AddRoomScheduleHandler implements PageHandler {
  public PAGE_NAME = Page.ADD_ROOM_SCHEDULE_PAGE

  public BODY = ScheduleRequestBody

  constructor(
    private readonly prisonService: PrisonService,
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly adminService: AdminService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params

    const [prison, room, courts, probationTeams] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.adminService.getLocationByDpsLocationId(dpsLocationId, user),
      this.courtsService.getAllEnabledCourts(user),
      this.probationTeamsService.getAllEnabledProbationTeams(user),
    ])

    if (room) {
      res.render('pages/admin/addAnotherRoomSchedule', { prison, room, courts, probationTeams })
    } else {
      next(new NotFound())
    }
  }

  public POST = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params

    const room: Location = await this.adminService.getLocationByDpsLocationId(dpsLocationId, user)
    if (room) {
      await this.adminService.createRoomSchedule(room.dpsLocationId, bodyToCreateScheduleRequest(req), user)
      res.addSuccessMessage('Schedule has been saved')
      res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
    } else {
      next(new NotFound())
    }
  }
}
