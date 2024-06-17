import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsOptional, Matches, ValidateIf } from 'class-validator'
import { addMinutes, isValid, startOfToday, subMinutes } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { convertToTitleCase, dateAtTime, parseDatePickerDate, simpleTimeToDate } from '../../../../utils/utils'
import YesNo from '../../../enumerator/yesNo'
import IsValidDate from '../../../validators/isValidDate'
import Validator from '../../../validators/validator'
import PrisonService from '../../../../services/prisonService'
import PrisonerService from '../../../../services/prisonerService'
import VideoLinkService from '../../../../services/videoLinkService'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'

class Body {
  @Expose()
  @IsNotEmpty({
    message: args =>
      `Select a ${(args.object as { type: string }).type === BavlJourneyType.COURT ? 'court' : 'probation team'}`,
  })
  agencyCode: string

  @Expose()
  @IsNotEmpty({ message: `Select a hearing type` })
  hearingTypeCode: string

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
    message: 'Select a end time that is after the start time',
  })
  @IsValidDate({ message: 'Enter a valid end time' })
  @IsNotEmpty({ message: 'Enter an end time' })
  endTime: Date

  @Expose()
  @IsNotEmpty({ message: 'Select a prison room for the court hearing' })
  location: string

  @Expose()
  @ValidateIf(o => o.type === BavlJourneyType.COURT)
  @IsEnum(YesNo, { message: 'Select if a pre-court hearing should be added' })
  preRequired: YesNo

  @Expose()
  @Transform(({ value, obj }) => (obj.preRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.type === BavlJourneyType.COURT)
  @ValidateIf(o => o.preRequired === YesNo.YES)
  @IsNotEmpty({ message: 'Select a prison room for the pre-court hearing' })
  preLocation: string

  @Expose()
  @ValidateIf(o => o.type === BavlJourneyType.COURT)
  @IsEnum(YesNo, { message: 'Select if a post-court hearing should be added' })
  postRequired: YesNo

  @Expose()
  @Transform(({ value, obj }) => (obj.postRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.type === BavlJourneyType.COURT)
  @ValidateIf(o => o.postRequired === YesNo.YES)
  @IsNotEmpty({ message: 'Select a prison room for the post-court hearing' })
  postLocation: string

  @Expose()
  @IsOptional()
  @Matches(/^https?:\/\/([^\s$.?#].\S*)?$/, { message: 'Enter a valid URL for the video link' })
  videoLinkUrl: string
}

export default class NewBookingHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_DETAILS_PAGE
  public BODY = Body

  constructor(
    private readonly courtsService: CourtsService,
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly prisonService: PrisonService,
    private readonly prisonerService: PrisonerService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { type } = req.params
    const prisonerNumber = req.params.prisonerNumber || req.session.journey.bookAVideoLink.prisoner.prisonerNumber

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const prisoner = await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)
    const rooms = await this.prisonService.getAppointmentLocations(prisoner.prisonId, user)

    const hearingTypes =
      type === BavlJourneyType.COURT
        ? await this.videoLinkService.getCourtHearingTypes(user)
        : await this.videoLinkService.getProbationMeetingTypes(user)

    res.render('pages/bookAVideoLink/newBooking', {
      prisoner: {
        name: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
        prisonerNumber: prisoner.prisonerNumber,
        prisonName: prisoner.prisonName,
      },
      agencies,
      rooms,
      hearingTypes,
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const {
      agencyCode,
      hearingTypeCode,
      date,
      startTime,
      endTime,
      location,
      preRequired,
      postRequired,
      preLocation,
      postLocation,
      videoLinkUrl,
    } = req.body

    const prisonerNumber = req.params.prisonerNumber || req.session.journey.bookAVideoLink.prisoner.prisonerNumber
    const prisoner = await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    req.session.journey.bookAVideoLink = {
      ...req.session.journey.bookAVideoLink,
      prisoner: {
        name: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
        prisonerNumber: prisoner.prisonerNumber,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
      },
      type: req.params.type.toUpperCase(),
      agencyCode,
      hearingTypeCode,
      date: date.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      preHearingStartTime: preRequired === YesNo.YES ? subMinutes(startTime, 15).toISOString() : undefined,
      preHearingEndTime: preRequired === YesNo.YES ? startTime.toISOString() : undefined,
      postHearingStartTime: postRequired === YesNo.YES ? endTime.toISOString() : undefined,
      postHearingEndTime: postRequired === YesNo.YES ? addMinutes(endTime, 15).toISOString() : undefined,
      locationCode: location,
      preLocationCode: preLocation,
      postLocationCode: postLocation,
      videoLinkUrl,
    }

    res.redirect('add-video-link-booking/check-booking')
  }
}
