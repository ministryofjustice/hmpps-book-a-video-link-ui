// eslint-disable-next-line max-classes-per-file
import { IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import { NextFunction, Request, Response } from 'express'
import { isValid, parseISO, format } from 'date-fns'
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
import {
  AmendDecoratedRoomRequest,
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  Location,
} from '../../../../@types/bookAVideoLinkApi/types'

// Start and end of day times (UTC) when the `all-day` radio is selected on schedules
const START_OF_DAY_TIME = new Date('1970-01-01T07:00:00.000Z')
const END_OF_DAY_TIME = new Date('1970-01-01T17:00:00.000Z')

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
        await this.adminService.amendRoomAttributes(room.dpsLocationId, this.bodyToAmendRoomRequest(req), user)
      } else {
        await this.adminService.createRoomAttributes(room.dpsLocationId, this.bodyToCreateRoomRequest(req), user)
      }

      if (existingSchedule === 'false' && permission === 'schedule') {
        await this.adminService.createRoomSchedule(room.dpsLocationId, this.bodyToCreateScheduleRequest(req), user)
      }

      res.addSuccessMessage('Room changes have been saved')
      res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
    } else {
      next(new NotFound())
    }
  }

  private bodyToCreateRoomRequest = (req: Request): CreateDecoratedRoomRequest => {
    const { roomStatus, videoUrl, permission, notes, courtCodes, probationTeamCodes } = req.body
    return {
      locationStatus: roomStatus === 'active' ? 'ACTIVE' : 'INACTIVE',
      prisonVideoUrl: videoUrl,
      locationUsage: permission.toUpperCase(),
      comments: notes,
      allowedParties: this.chooseAllowedParties(permission, courtCodes, probationTeamCodes),
    } as CreateDecoratedRoomRequest
  }

  private bodyToAmendRoomRequest = (req: Request): AmendDecoratedRoomRequest => {
    const { roomStatus, videoUrl, permission, notes, courtCodes, probationTeamCodes } = req.body
    return {
      locationStatus: roomStatus === 'active' ? 'ACTIVE' : 'INACTIVE',
      prisonVideoUrl: videoUrl,
      locationUsage: permission.toUpperCase(),
      comments: notes,
      allowedParties: this.chooseAllowedParties(permission, courtCodes, probationTeamCodes),
    } as AmendDecoratedRoomRequest
  }

  private bodyToCreateScheduleRequest = (req: Request): CreateRoomScheduleRequest => {
    const {
      scheduleStartDay,
      scheduleEndDay,
      allDay,
      scheduleStartTime,
      scheduleEndTime,
      schedulePermission,
      scheduleCourtCodes,
      scheduleProbationTeamCodes,
    } = req.body

    // Use fixed start and end times if the all-day checkbox is clicked, otherwise the selected times
    const startTime: string = allDay ? START_OF_DAY_TIME.toISOString() : scheduleStartTime.toISOString()
    const endTime: string = allDay ? END_OF_DAY_TIME.toISOString() : scheduleEndTime.toISOString()

    // Parse to a Date object
    const startTimeAsDate = parseISO(startTime)
    const endTimeAsDate = parseISO(endTime)

    return {
      startDayOfWeek: parseInt(scheduleStartDay, 10),
      endDayOfWeek: parseInt(scheduleEndDay, 10),
      startTime: format(startTimeAsDate, 'HH:mm'),
      endTime: format(endTimeAsDate, 'HH:mm'),
      locationUsage: schedulePermission.toUpperCase(),
      allowedParties: this.chooseAllowedParties(schedulePermission, scheduleCourtCodes, scheduleProbationTeamCodes),
    } as CreateRoomScheduleRequest
  }

  private chooseAllowedParties = (permission: string, courtCodes: string[], probationTeamCodes: string[]): string[] => {
    switch (permission) {
      case 'court':
        return courtCodes
      case 'probation':
        return probationTeamCodes
      default:
        return []
    }
  }
}
