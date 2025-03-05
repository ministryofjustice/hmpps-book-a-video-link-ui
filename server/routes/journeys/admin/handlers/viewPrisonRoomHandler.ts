// eslint-disable-next-line max-classes-per-file
import { IsNotEmpty, ValidateIf } from 'class-validator'
import { NextFunction, Request, Response } from 'express'
import { isValid, parseISO, format } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import { NotFound } from 'http-errors'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import { dayOfWeekArray, simpleTimeToDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'
import AdminService from '../../../../services/adminService'
import Validator from '../../../validators/validator'
import IsValidDate from '../../../validators/isValidDate'
import { Location, RoomAttributes, RoomSchedule } from '../../../../@types/bookAVideoLinkApi/types'

class Body {
  @Expose()
  @IsNotEmpty({ message: `Select a room status` })
  roomStatus: string

  @Expose()
  videoUrl: string

  @Expose()
  @IsNotEmpty({ message: `Select a room permission` })
  permission: string

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  courtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  probationTeamCodes: string[]

  @Expose()
  existingSchedule: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @IsNotEmpty({ message: `Select a schedule start day` })
  scheduleStartDay: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @Validator((scheduleEndDay, { scheduleStartDay }) => +scheduleEndDay >= +scheduleStartDay, {
    message: 'Enter a schedule end day that is the same or after the schedule start day',
  })
  @IsNotEmpty({ message: `Select a schedule end day` })
  scheduleEndDay: string

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @IsNotEmpty({ message: `Select a schedule permission` })
  schedulePermission: string

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  scheduleCourtCodes: string[]

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  scheduleProbationTeamCodes: string[]

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
  @Transform(({ value }) => simpleTimeToDate(value))
  @IsValidDate({ message: 'Enter a valid schedule start time' })
  @IsNotEmpty({ message: 'Enter a schedule start time' })
  scheduleStartTime: Date

  @Expose()
  @ValidateIf(o => o.existingSchedule === 'false' && o.permission === 'schedule')
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

    const [prison, locationList, courts, probationTeams] = await Promise.all([
      this.prisonService.getPrisonByCode(prisonCode, user),
      this.prisonService.getAppointmentLocations(prisonCode, true, user),
      this.courtsService.getAllEnabledCourts(user),
      this.probationTeamsService.getAllEnabledProbationTeams(user),
    ])

    const room: Location = locationList.find(loc => loc.dpsLocationId === dpsLocationId)
    if (room) {
      res.render('pages/admin/viewPrisonRoom', { prison, room, courts, probationTeams })
    } else {
      next(new NotFound())
    }
  }

  public POST = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals
    const { prisonCode, dpsLocationId } = req.params
    const { roomStatus, videoUrl, permission, existingSchedule, notes, courtCodes, probationTeamCodes } = req.body

    const locationList: Location[] = await this.prisonService.getAppointmentLocations(prisonCode, true, user)
    const room: Location = locationList.find(loc => loc.dpsLocationId === dpsLocationId)

    if (room) {
      const roomAttributes: RoomAttributes = this.buildRoomAttributes(
        roomStatus,
        videoUrl,
        permission,
        notes,
        courtCodes,
        probationTeamCodes,
      )

      if (room.extraAttributes) {
        await this.adminService.amendRoomAttributes(room.dpsLocationId, roomAttributes, user)
      } else {
        await this.adminService.createRoomAttributes(room.dpsLocationId, roomAttributes, user)
      }

      if (existingSchedule === 'false' && roomAttributes.locationUsage === 'SCHEDULE') {
        const { scheduleStartDay, scheduleEndDay, scheduleStartTime, scheduleEndTime } = req.body
        const { schedulePermission, scheduleCourtCodes, scheduleProbationTeamCodes } = req.body
        const roomSchedule: RoomSchedule = this.buildRoomSchedule(
          scheduleStartDay,
          scheduleEndDay,
          scheduleStartTime.toISOString(),
          scheduleEndTime.toISOString(),
          schedulePermission,
          scheduleCourtCodes,
          scheduleProbationTeamCodes,
        )

        await this.adminService.createRoomSchedule(room.dpsLocationId, roomSchedule, user)
      }

      // TODO: Redirect with success message
      res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
    } else {
      next(new NotFound())
    }
  }

  private buildRoomAttributes = (
    roomStatus: string,
    videoUrl: string,
    permission: string,
    notes: string,
    courtCodes: string[],
    probationTeamCodes: string[],
  ): RoomAttributes => {
    return {
      attributeId: 0,
      locationStatus: roomStatus === 'active' ? 'ACTIVE' : 'INACTIVE',
      prisonVideoUrl: videoUrl,
      locationUsage: permission.toUpperCase(),
      notes,
      allowedParties: this.chooseAllowedParties(permission, courtCodes, probationTeamCodes),
    } as RoomAttributes
  }

  private buildRoomSchedule = (
    scheduleStartDay: string,
    scheduleEndDay: string,
    scheduleStartTime: string,
    scheduleEndTime: string,
    schedulePermission: string,
    scheduleCourtCodes: string[],
    scheduleProbationTeamCodes: string[],
  ): RoomSchedule => {
    const startDayOfWeek: string = dayOfWeekArray()[parseInt(scheduleStartDay, 10) - 1]
    const endDayOfWeek: string = dayOfWeekArray()[parseInt(scheduleEndDay, 10) - 1]
    const startTimeDate = parseISO(scheduleStartTime)
    const endTimeDate = parseISO(scheduleEndTime)

    return {
      scheduleId: 0,
      startDayOfWeek,
      endDayOfWeek,
      startTime: format(startTimeDate, 'HH:mm'),
      endTime: format(endTimeDate, 'HH:mm'),
      locationUsage: schedulePermission.toUpperCase(),
      allowedParties: this.chooseAllowedParties(schedulePermission, scheduleCourtCodes, scheduleProbationTeamCodes),
    } as RoomSchedule
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
