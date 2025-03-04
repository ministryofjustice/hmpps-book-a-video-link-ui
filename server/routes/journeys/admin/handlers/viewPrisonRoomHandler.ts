// eslint-disable-next-line max-classes-per-file
import { IsNotEmpty, ValidateIf } from 'class-validator'
import { NextFunction, Request, Response } from 'express'
import { isValid } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import { NotFound } from 'http-errors'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import { simpleTimeToDate } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import logger from '../../../../../logger'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import CourtsService from '../../../../services/courtsService'
import Validator from '../../../validators/validator'
import IsValidDate from '../../../validators/isValidDate'

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

    const room = locationList.find(loc => loc.dpsLocationId === dpsLocationId)

    if (room) {
      res.render('pages/admin/viewPrisonRoom', { prison, room, courts, probationTeams })
    } else {
      next(new NotFound())
    }
  }

  public POST = async (req: Request, res: Response) => {
    const { prisonCode, dpsLocationId } = req.params

    logger.info(`POST body is ${JSON.stringify(req.body, null, 2)}`)

    // TODO: Save the values here
    // TODO: Individual schedule rows saved separately?
    // TODO: Validation class for the input values above
    // TODO: Redirect with success message

    res.redirect(`/admin/view-prison-room/${prisonCode}/${dpsLocationId}`)
  }
}
