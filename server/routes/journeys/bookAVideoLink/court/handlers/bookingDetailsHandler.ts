// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { addMinutes, isValid, startOfToday, subMinutes } from 'date-fns'
import { Expose, Transform } from 'class-transformer'
import {
  IsEnum,
  isNotEmpty,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  MaxLength,
  ValidateIf,
  ValidationArguments,
} from 'class-validator'
import CustomOneOrTheOther from '../../../../../validators/customOneOrTheOther'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import CourtsService from '../../../../../services/courtsService'
import { dateAtTime, parseDatePickerDate, simpleTimeToDate } from '../../../../../utils/utils'
import YesNo from '../../../../enumerator/yesNo'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import PrisonerService from '../../../../../services/prisonerService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import config from '../../../../../config'

class Body {
  @Expose()
  @IsNotEmpty({ message: `Select a court` })
  courtCode: string

  @Expose()
  @IsNotEmpty({ message: `Select a hearing type` })
  hearingTypeCode: string

  @Expose()
  @IsEnum(YesNo, { message: 'Select if you know the court hearing link' })
  @CustomOneOrTheOther('videoLinkUrl', 'hmctsNumber', config.featureToggles.hmctsLinkAndGuestPin, {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: (args: ValidationArguments) => {
      if (config.featureToggles.hmctsLinkAndGuestPin) {
        return 'Enter number from CVP address or enter full web address (URL)'
      }
      return 'Enter court hearing link'
    },
  })
  cvpRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.cvpRequired === YesNo.YES && isNotEmpty(o.videoLinkUrl))
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  videoLinkUrl: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === YesNo.YES ? value : undefined))
  @ValidateIf(
    o => o.cvpRequired === YesNo.YES && config.featureToggles.hmctsLinkAndGuestPin && isNotEmpty(o.hmctsNumber),
  )
  @MaxLength(8, { message: 'Number from CVP address must be $constraint1 characters or less' })
  @IsNumberString({ no_symbols: true }, { message: 'Number from CVP address must be a number, like 3457' })
  hmctsNumber: string

  @Expose()
  @ValidateIf(() => config.featureToggles.hmctsLinkAndGuestPin)
  @IsEnum(YesNo, { message: 'Select if you know the guest pin' })
  guestPinRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.guestPinRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.guestPinRequired === YesNo.YES && config.featureToggles.hmctsLinkAndGuestPin)
  @MaxLength(8, { message: 'Guest pin must be $constraint1 characters or less' })
  @IsNumberString({ no_symbols: true }, { message: 'Guest pin must be a number, like 1344' })
  @IsNotEmpty({ message: 'Enter the guest pin' })
  guestPin: string

  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date which is on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date' })
  @IsNotEmpty({ message: 'Enter a date' })
  date: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator(
    (startTime, { date }) => date < startOfToday() || dateAtTime(date, startTime) > addMinutes(new Date(), 15),
    {
      // To allow for a pre-court hearing starting 15 minutes before the main hearing
      message: 'Enter a time which is at least 15 minutes in the future',
    },
  )
  @IsValidDate({ message: 'Enter a valid start time' })
  @IsNotEmpty({ message: 'Enter a start time' })
  startTime: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator((endTime, { startTime }) => (isValid(startTime) ? endTime > startTime : true), {
    message: 'Select an end time that is after the start time',
  })
  @IsValidDate({ message: 'Enter a valid end time' })
  @IsNotEmpty({ message: 'Enter an end time' })
  endTime: Date

  @Expose()
  @IsEnum(YesNo, { message: 'Select if a pre-court hearing should be added' })
  preRequired: YesNo

  @Expose()
  @IsEnum(YesNo, { message: 'Select if a post-court hearing should be added' })
  postRequired: YesNo

  @Expose()
  @ValidateIf(o => o.notesForStaff && config.featureToggles.masterPublicPrivateNotes)
  @IsOptional()
  @MaxLength(400, { message: 'Notes for prison staff must be $constraint1 characters or less' })
  notesForStaff: string
}

export default class BookingDetailsHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_DETAILS_PAGE

  public BODY = Body

  constructor(
    private readonly courtsService: CourtsService,
    private readonly prisonerService: PrisonerService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params

    const journey = req.session.journey.bookACourtHearing
    const offender = journey?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber
    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const courts = await this.courtsService.getUserPreferences(user)
    const hearingTypes = await this.referenceDataService.getCourtHearingTypes(user)

    res.render('pages/bookAVideoLink/court/bookingDetails', {
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonName: prisoner.prisonName,
      },
      courts,
      hearingTypes,
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params

    const offender = req.session.journey.bookACourtHearing?.prisoner
    const {
      courtCode,
      hearingTypeCode,
      cvpRequired,
      videoLinkUrl,
      hmctsNumber,
      guestPinRequired,
      guestPin,
      date,
      startTime,
      endTime,
      preRequired,
      postRequired,
      notesForStaff,
    } = req.body

    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber
    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    req.session.journey.bookACourtHearing = {
      ...req.session.journey.bookACourtHearing,
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
      },
      courtCode,
      hearingTypeCode,
      date: date.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      preHearingStartTime: preRequired === YesNo.YES ? subMinutes(startTime, 15).toISOString() : undefined,
      preHearingEndTime: preRequired === YesNo.YES ? startTime.toISOString() : undefined,
      postHearingStartTime: postRequired === YesNo.YES ? endTime.toISOString() : undefined,
      postHearingEndTime: postRequired === YesNo.YES ? addMinutes(endTime, 15).toISOString() : undefined,
      cvpRequired: cvpRequired === YesNo.YES,
      videoLinkUrl,
      hmctsNumber,
      guestPinRequired: guestPinRequired === YesNo.YES,
      guestPin,
      notesForStaff,
    }

    return mode === 'request'
      ? res.redirect('video-link-booking/check-booking')
      : res.redirect('video-link-booking/select-rooms')
  }
}
