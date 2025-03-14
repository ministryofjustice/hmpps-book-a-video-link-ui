// eslint-disable-next-line max-classes-per-file
import { IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import { NextFunction, Request, Response } from 'express'
import { isValid } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import { NotFound } from 'http-errors'
import _ from 'lodash'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import { simpleTimeToDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'
import AdminService from '../../../../services/adminService'
import Validator from '../../../validators/validator'
import IsValidDate from '../../../validators/isValidDate'
import { Location } from '../../../../@types/bookAVideoLinkApi/types'
import { bodyToAmendRoomRequest, bodyToCreateRoomRequest, bodyToCreateScheduleRequest } from './shared/roomFunctions'

class Body {
  @Expose()
  @IsNotEmpty({ message: 'Select a room status' })
  roomStatus: string

  @Expose()
  @ValidateIf(o => o.videoUrl)
  @MaxLength(120, { message: 'The room link must be less than 120 characters' })
  videoUrl: string

  @Expose()
  @IsNotEmpty({ message: 'Select a room permission' })
  permission: string

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  courtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  probationTeamCodes: string[]

  @Expose()
  existingSchedule: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @IsNotEmpty({ message: 'Select a schedule start day' })
  scheduleStartDay: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @Validator((scheduleEndDay, { scheduleStartDay }) => +scheduleEndDay >= +scheduleStartDay, {
    message: 'Enter a schedule end day that is the same or after the schedule start day',
  })
  @IsNotEmpty({ message: 'Select a schedule end day' })
  scheduleEndDay: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @IsNotEmpty({ message: 'Select a schedule permission' })
  schedulePermission: string

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  scheduleCourtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? _.uniq([value].flat().filter(Boolean)) : []))
  scheduleProbationTeamCodes: string[]

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule' && !o.allDay)
  @Transform(({ value }) => simpleTimeToDate(value))
  @IsValidDate({ message: 'Enter a valid schedule start time' })
  @IsNotEmpty({ message: 'Enter a schedule start time' })
  scheduleStartTime: Date

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule' && !o.allDay)
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator(
    (scheduleEndTime, { scheduleStartTime }) =>
      isValid(scheduleStartTime) ? scheduleEndTime > scheduleStartTime : true,
    {
      message: 'Enter a schedule end time that is after the start time',
    },
  )
  @IsValidDate({ message: 'Enter a valid schedule end time' })
  @IsNotEmpty({ message: 'Enter a schedule end time' })
  scheduleEndTime: Date

  @Expose()
  @Transform(({ value }) => value === 'Yes')
  allDay: boolean

  @Expose()
  @ValidateIf(o => o.notes)
  @MaxLength(100, { message: 'The comments must be at most 100 characters' })
  notes: string
}

export default class ViewPrisonRoomHandler implements PageHandler {
  public PAGE_NAME = Page.VIEW_PRISON_ROOM_PAGE

  public BODY = Body

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
