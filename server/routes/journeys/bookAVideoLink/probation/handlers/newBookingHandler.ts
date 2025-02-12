// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { isValid, startOfToday } from 'date-fns'
import { Page } from '../../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import {
  dateAtTime,
  extractPrisonAppointmentsFromBooking,
  formatDate,
  parseDatePickerDate,
  simpleTimeToDate,
} from '../../../../../utils/utils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import PrisonService from '../../../../../services/prisonService'
import PrisonerService from '../../../../../services/prisonerService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { PrisonAppointment } from '../../../../../@types/bookAVideoLinkApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'

class Body {
  @Expose()
  @IsNotEmpty({ message: `Select a probation team` })
  agencyCode: string

  @Expose()
  @IsNotEmpty({ message: `Select a meeting type` })
  hearingTypeCode: string

  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date which is on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date' })
  @IsNotEmpty({ message: 'Enter a date' })
  date: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator((startTime, { date }) => date < startOfToday() || dateAtTime(date, startTime) > new Date(), {
    message: 'Enter a time which is in the future',
  })
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
  @IsNotEmpty({ message: 'Select a prison room for the probation meeting' })
  location: string
}

export default class NewBookingHandler implements PageHandler {
  public PAGE_NAME = Page.BOOKING_DETAILS_PAGE

  public BODY = Body

  constructor(
    private readonly probationTeamsService: ProbationTeamsService,
    private readonly prisonService: PrisonService,
    private readonly prisonerService: PrisonerService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly videoLinkService: VideoLinkService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode } = req.params
    const bookingId = req.session.journey.bookAVideoLink?.bookingId
    const offender = req.session.journey.bookAVideoLink?.prisoner
    const prisonerNumber = req.params.prisonerNumber || offender.prisonerNumber

    const agencies = await this.probationTeamsService.getUserPreferences(user)

    const prisoner =
      mode === 'request' ? offender : await this.prisonerService.getPrisonerByPrisonerNumber(prisonerNumber, user)

    const rooms = await this.getRooms(prisoner.prisonId, bookingId, user)

    const hearingTypes = await this.referenceDataService.getProbationMeetingTypes(user)

    res.render('pages/bookAVideoLink/probation/newBooking', {
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

    const { agencyCode, hearingTypeCode, date, startTime, endTime, location } = req.body

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
      prisoner: {
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        dateOfBirth: prisoner.dateOfBirth,
        prisonerNumber: prisoner.prisonerNumber,
        prisonId: prisoner.prisonId,
        prisonName: prisoner.prisonName,
      },
      type: 'PROBATION',
      agencyCode,
      hearingTypeCode,
      date: date.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      locationCode: location,
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
    const { mainAppointment } = bookingId
      ? await this.videoLinkService
          .getVideoLinkBookingById(bookingId, user)
          .then(booking => extractPrisonAppointmentsFromBooking(booking))
      : {}
    const videoRoomKeys = videoRooms.map(r => r.key)

    const isRoomAllowed = (roomKey: string, appointment: PrisonAppointment) =>
      appointment?.prisonLocKey === roomKey || videoRoomKeys.includes(roomKey)

    return appointmentRooms.map(room => ({
      ...room,
      allowedForMain: isRoomAllowed(room.key, mainAppointment),
    }))
  }

  private validateSchedule = async (prisonId: string, bookingId: number, body: Body, user: Express.User) => {
    // NOTE: The prison staff may create or amend a booking to place the appointment in a non-video enabled room
    // In this case, the user may not change the schedule of the appointments, without also selecting a video enabled room.
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

    const locations: Pick<Body, 'location'> = { location: body.location }

    return Object.entries(locations)
      .filter(([_, value]) => value && !videoRoomsKeys.includes(value))
      .map(([key]) => key)
  }
}
