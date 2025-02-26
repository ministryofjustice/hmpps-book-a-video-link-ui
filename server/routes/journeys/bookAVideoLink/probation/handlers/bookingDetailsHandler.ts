// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { ArrayNotEmpty, Equals, IsEmail, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator'
import { startOfToday } from 'date-fns'
import { parsePhoneNumberWithError } from 'libphonenumber-js'
import _ from 'lodash'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../../utils/utils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import PrisonerService from '../../../../../services/prisonerService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import IsValidUkPhoneNumber from '../../../../validators/isValidUkPhoneNumber'

class Body {
  @Expose()
  @IsNotEmpty({ message: `Select a probation team` })
  probationTeamCode: string

  @Expose()
  @Transform(({ obj }) =>
    !obj.officerDetailsNotKnown && !obj.officerFullName && !obj.officerEmail && !obj.officerTelephone
      ? null
      : !!obj.officerDetailsNotKnown !== !!(obj.officerFullName || obj.officerEmail || obj.officerTelephone),
  )
  @Equals(true, { message: `Enter either the probation officer's details, or select 'Not yet known'` })
  @IsNotEmpty({ message: "Enter the probation officer's details" })
  officerDetailsOrUnknown: boolean

  @Expose()
  @Transform(({ value }) => value === 'true')
  officerDetailsNotKnown: boolean

  @Expose()
  @ValidateIf(o => o.officerDetailsOrUnknown && !o.officerDetailsNotKnown)
  @IsNotEmpty({ message: `Enter the probation officer's full name` })
  officerFullName: string

  @Expose()
  @ValidateIf(o => o.officerDetailsOrUnknown && !o.officerDetailsNotKnown)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: `Enter the probation officer's email address` })
  officerEmail: string

  @Expose()
  @ValidateIf(o => o.officerDetailsOrUnknown && !o.officerDetailsNotKnown)
  @IsOptional()
  @IsValidUkPhoneNumber({ message: 'Enter a valid UK phone number' })
  officerTelephone: string

  @Expose()
  @IsNotEmpty({ message: `Select a meeting type` })
  meetingTypeCode: string

  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date which is on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date' })
  @IsNotEmpty({ message: 'Enter a date' })
  date: Date

  @Expose()
  @IsNotEmpty({ message: 'Select a meeting duration' })
  duration: string

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  @ArrayNotEmpty({ message: `Select at least one time period` })
  timePeriods: string[]
}

export default class BookingDetailsHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_DETAILS_PAGE

  public BODY = Body

  constructor(
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly prisonerService: PrisonerService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params
    const offender = req.session.journey.bookAProbationMeeting?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber

    const probationTeams = await this.probationTeamsService.getUserPreferences(user)

    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const meetingTypes = await this.referenceDataService.getProbationMeetingTypes(user)

    res.render('pages/bookAVideoLink/probation/bookingDetails', {
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonName: prisoner.prisonName,
      },
      probationTeams,
      meetingTypes,
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params
    const offender = req.session.journey.bookAProbationMeeting?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber

    const {
      probationTeamCode,
      officerDetailsNotKnown,
      officerFullName,
      officerEmail,
      officerTelephone,
      meetingTypeCode,
      date,
      duration,
      timePeriods,
    } = req.body

    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const scheduleUnamended =
      mode === 'amend' &&
      date.toISOString() === req.session.journey.bookAProbationMeeting.date &&
      +duration === req.session.journey.bookAProbationMeeting.duration &&
      _.isEqual(timePeriods, req.session.journey.bookAProbationMeeting.timePeriods)

    req.session.journey.bookAProbationMeeting = {
      ...req.session.journey.bookAProbationMeeting,
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
      },
      probationTeamCode,
      officerDetailsNotKnown,
      officer: officerDetailsNotKnown
        ? undefined
        : {
            fullName: officerFullName,
            email: officerEmail,
            telephone: officerTelephone
              ? parsePhoneNumberWithError(officerTelephone, 'GB').formatNational()
              : undefined,
          },
      meetingTypeCode,
      date: date.toISOString(),
      duration: +duration,
      timePeriods,
    }

    return res.redirect(scheduleUnamended ? 'video-link-booking/check-booking' : 'video-link-booking/availability')
  }
}
