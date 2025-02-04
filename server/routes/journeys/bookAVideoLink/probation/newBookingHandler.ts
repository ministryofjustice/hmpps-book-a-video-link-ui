// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import { addMinutes, isValid, startOfToday, subMinutes } from 'date-fns'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import {
  dateAtTime,
  extractPrisonAppointmentsFromBooking,
  formatDate,
  parseDatePickerDate,
  simpleTimeToDate,
} from '../../../../utils/utils'
import YesNo from '../../../enumerator/yesNo'
import IsValidDate from '../../../validators/isValidDate'
import Validator from '../../../validators/validator'
import PrisonService from '../../../../services/prisonService'
import PrisonerService from '../../../../services/prisonerService'
import VideoLinkService from '../../../../services/videoLinkService'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'
import { PrisonAppointment } from '../../../../@types/bookAVideoLinkApi/types'

class Body {
  @Expose()
  @IsNotEmpty({
    message: args =>
      `Select a ${(args.object as { type: string }).type === BavlJourneyType.COURT ? 'court' : 'probation team'}`,
  })
  agencyCode: string

  @Expose()
  @IsNotEmpty({
    message: args =>
      `Select a ${(args.object as { type: string }).type === BavlJourneyType.COURT ? 'hearing type' : 'meeting type'}`,
  })
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
  @ValidateIf(o => o.type === BavlJourneyType.COURT)
  @IsEnum(YesNo, { message: 'Select if you know the court hearing link' })
  cvpRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.cvpRequired === YesNo.YES)
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  @IsNotEmpty({ message: 'Enter the court hearing link' })
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
    const { type, mode } = req.params
    const bookingId = req.session.journey.bookAVideoLink?.bookingId
    const offender = req.session.journey.bookAVideoLink?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber

    const agencies =
      type === BavlJourneyType.COURT
        ? await this.courtsService.getUserPreferences(user)
        : await this.probationTeamsService.getUserPreferences(user)

    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const rooms = await this.getRooms(prisoner.prisonId, bookingId, user)

    const hearingTypes =
      type === BavlJourneyType.COURT
        ? await this.videoLinkService.getCourtHearingTypes(user)
        : await this.videoLinkService.getProbationMeetingTypes(user)

    res.render('pages/bookAVideoLink/court/newBooking', {
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonName: prisoner.prisonName,
      },
      agencies,
      rooms,
      hearingTypes,
      fromReview: req.get('Referrer')?.endsWith('check-booking'),
    })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params
    const bookingId = req.session.journey.bookAVideoLink?.bookingId
    const offender = req.session.journey.bookAVideoLink?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber

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

    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const fieldsWithErrors = await this.validateSchedule(prisoner.prisonId, bookingId, req.body, user)
    if (fieldsWithErrors.length > 0) {
      fieldsWithErrors.forEach(field => {
        res.addValidationError(
          `You cannot change the time for this room. Select another room or contact the prison.`,
          field,
        )
      })

      return res.validationFailed()
    }

    req.session.journey.bookAVideoLink = {
      ...req.session.journey.bookAVideoLink,
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
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

    return res.redirect('video-link-booking/check-booking')
  }

  private getRooms = async (prisonId: string, bookingId: number, user: Express.User) => {
    // NOTE: The prison staff may create or amend a booking to place the pre, main or post appointment in a non-video enabled room
    // In this case, the non-video enabled room should be selectable in the dropdown for the court user
    const [videoRooms, appointmentRooms] = await Promise.all([
      this.prisonService.getAppointmentLocations(prisonId, true, user),
      this.prisonService.getAppointmentLocations(prisonId, false, user),
    ])
    const { preAppointment, mainAppointment, postAppointment } = bookingId
      ? await this.videoLinkService
          .getVideoLinkBookingById(bookingId, user)
          .then(booking => extractPrisonAppointmentsFromBooking(booking))
      : {}
    const videoRoomKeys = videoRooms.map(r => r.key)

    const isRoomAllowed = (roomKey: string, appointment: PrisonAppointment) =>
      appointment?.prisonLocKey === roomKey || videoRoomKeys.includes(roomKey)

    return appointmentRooms.map(room => ({
      ...room,
      allowedForPre: isRoomAllowed(room.key, preAppointment),
      allowedForMain: isRoomAllowed(room.key, mainAppointment),
      allowedForPost: isRoomAllowed(room.key, postAppointment),
    }))
  }

  private validateSchedule = async (prisonId: string, bookingId: number, body: Body, user: Express.User) => {
    // NOTE: The prison staff may create or amend a booking to place the pre, main or post appointment in a non-video enabled room
    // In this case, the court user may not change the schedule of the appointments, without also selecting a video enabled room.
    const { mainAppointment } = bookingId
      ? await this.videoLinkService
          .getVideoLinkBookingById(bookingId, user)
          .then(booking => extractPrisonAppointmentsFromBooking(booking))
      : {}

    if (
      !mainAppointment ||
      (mainAppointment.appointmentDate === formatDate(body.date, 'yyyy-MM-dd') &&
        mainAppointment.startTime === formatDate(body.startTime, 'HH:mm') &&
        mainAppointment.endTime === formatDate(body.endTime, 'HH:mm'))
    ) {
      return []
    }

    const videoRoomsKeys = await this.prisonService
      .getAppointmentLocations(prisonId, true, user)
      .then(room => room.map(r => r.key))

    const locations: Pick<Body, 'preLocation' | 'location' | 'postLocation'> = {
      preLocation: body.preLocation,
      location: body.location,
      postLocation: body.postLocation,
    }

    return Object.entries(locations)
      .filter(([_, value]) => value && !videoRoomsKeys.includes(value))
      .map(([key]) => key)
  }
}
