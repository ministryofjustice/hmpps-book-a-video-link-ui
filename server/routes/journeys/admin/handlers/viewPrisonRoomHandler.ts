import { NextFunction, Request, Response } from 'express'
import { NotFound } from 'http-errors'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import PrisonService from '../../../../services/prisonService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'
import AdminService from '../../../../services/adminService'
import { Location } from '../../../../@types/bookAVideoLinkApi/types'
import { bodyToAmendRoomRequest, bodyToCreateRoomRequest, bodyToCreateScheduleRequest } from './shared/roomFunctions'
import RoomAndScheduleRequestBody from './shared/roomAndScheduleRequestBody'

export default class ViewPrisonRoomHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_ROOM_PAGE

  public BODY = RoomAndScheduleRequestBody

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
      res.render('pages/admin/prisonRoomDecorations', { prison, room, courts, probationTeams })
    } else {
      next(new NotFound())
    }
  }

  public POST = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params
    const { existingSchedule, permission } = req.body

    const room: Location = await this.adminService.getLocationByDpsLocationId(dpsLocationId, user)
    if (room) {
      if (room.extraAttributes) {
        await this.adminService.amendRoomAttributes(room.dpsLocationId, bodyToAmendRoomRequest(req), user)
      } else {
        await this.adminService.createRoomAttributes(room.dpsLocationId, bodyToCreateRoomRequest(req), user)
      }

      if (existingSchedule === 'false' && permission === 'schedule') {
        await this.adminService.createRoomSchedule(room.dpsLocationId, bodyToCreateScheduleRequest(req), user)
      }

      res.addSuccessMessage('Room changes have been saved')
      res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
    } else {
      next(new NotFound())
    }
  }
}
