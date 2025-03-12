import { NextFunction, Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'
import AdminService from '../../../../services/adminService'

export default class DeleteRoomScheduleHandler implements PageHandler {
  public PAGE_NAME = Page.DELETE_ROOM_SCHEDULE_PAGE

  constructor(
    private readonly prisonService: PrisonService,
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly adminService: AdminService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId, scheduleId } = req.params

    const [prison, room, courts, probationTeams] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.adminService.getLocationByDpsLocationId(dpsLocationId, user),
      this.courtsService.getAllEnabledCourts(user),
      this.probationTeamsService.getAllEnabledProbationTeams(user),
    ])

    if (room) {
      res.render('pages/admin/deleteRoomSchedule', { prison, room, scheduleId, courts, probationTeams })
    } else {
      next(new NotFound())
    }
  }

  public POST = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId, scheduleId } = req.params

    await this.adminService.deleteRoomSchedule(dpsLocationId, +scheduleId, user)

    res.addSuccessMessage('The schedule was deleted')
    res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
  }
}
