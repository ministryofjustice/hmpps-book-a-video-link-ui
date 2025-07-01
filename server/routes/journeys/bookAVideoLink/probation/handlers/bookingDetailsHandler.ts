// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { ArrayNotEmpty, Equals, IsEmail, IsNotEmpty, IsOptional, MaxLength, ValidateIf } from 'class-validator'
import { isValid, startOfToday } from 'date-fns'
import { parsePhoneNumberWithError } from 'libphonenumber-js'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import { dateAtTime, parseDatePickerDate, simpleTimeToDate } from '../../../../../utils/utils'
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
  @ValidateIf(o => o.mode !== 'request')
  @IsNotEmpty({ message: 'Select a meeting duration' })
  duration: string

  @Expose()
  @Transform(({ value }) => (value ? [value].flat() : []))
  @ValidateIf(o => o.mode !== 'request')
  @ArrayNotEmpty({ message: `Select at least one time period` })
  timePeriods: string[]

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @ValidateIf(o => o.mode === 'request')
  @Validator((startTime, { date }) => date < startOfToday() || dateAtTime(date, startTime) > new Date(), {
    message: 'Enter a time which is in the future',
  })
  @IsValidDate({ message: 'Enter a valid start time' })
  @IsNotEmpty({ message: 'Enter a start time' })
  startTime: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @ValidateIf(o => o.mode === 'request')
  @Validator((endTime, { startTime }) => (isValid(startTime) ? endTime > startTime : true), {
    message: 'Select an end time that is after the start time',
  })
  @IsValidDate({ message: 'Enter a valid end time' })
  @IsNotEmpty({ message: 'Enter an end time' })
  endTime: Date

  @Expose()
  @ValidateIf(o => o.notesForStaff)
  @IsOptional()
  @MaxLength(400, { message: 'Notes for prison staff must be $constraint1 characters or less' })
  notesForStaff: string
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
      startTime,
      endTime,
      notesForStaff,
    } = req.body

    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

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
      notesForStaff,
    }

    if (mode === 'request') {
      req.session.journey.bookAProbationMeeting = {
        ...req.session.journey.bookAProbationMeeting,
        startTime,
        endTime,
      }
    } else {
      req.session.journey.bookAProbationMeeting = {
        ...req.session.journey.bookAProbationMeeting,
        duration: +duration,
        timePeriods,
      }
    }

    return res.redirect(mode === 'request' ? 'video-link-booking/check-booking' : 'video-link-booking/availability')
  }
}
