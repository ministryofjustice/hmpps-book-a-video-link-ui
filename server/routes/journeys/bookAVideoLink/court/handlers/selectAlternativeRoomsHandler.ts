// eslint-disable-next-line max-classes-per-file
import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { addMinutes, parse, parseISO, subMinutes } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import CourtBookingService from '../../../../../services/courtBookingService'
import { BookACourtHearingJourney } from '../journey'
import TelemetryService from '../../../../../services/telemetryService'
import { formatDate } from '../../../../../utils/utils'

class Body {
  @Expose()
  @IsNotEmpty({ message: `Select a suitable slot` })
  option: string

  @Expose()
  @Transform(({ obj }) => obj.option && parse(obj.option.split('///')[0], 'HH:mm', new Date(0), { locale: enGB }))
  startTime: string

  @Expose()
  @Transform(({ obj }) => obj.option && parse(obj.option.split('///')[1], 'HH:mm', new Date(0), { locale: enGB }))
  endTime: string

  @Expose()
  @Transform(({ obj }) => obj.option && obj.option.split('///')[2])
  dpsLocationKey: string

  @Expose()
  @Transform(({ obj }) => obj.option && obj.option.split('///')[3])
  timeSlot: string
}

export default class SelectAlternativeRoomsHandler implements PageHandler {
  public PAGE_NAME = Page.SELECT_ALTERNATIVE_ROOMS_PAGE

  public BODY = Body

  constructor(
    private readonly courtBookingService: CourtBookingService,
    private readonly telemetryService: TelemetryService,
  ) {}

  public GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { bookACourtHearing } = req.session.journey

    const { locations } = await this.courtBookingService.getAvailableLocations(bookACourtHearing, user)

    const eventToRecord = {
      bookingDate: formatDate(bookACourtHearing.date, 'yyyy-MM-dd'),
      prisonCode: bookACourtHearing.prisoner?.prisonId,
      prisonerNumber: bookACourtHearing.prisoner?.prisonerNumber,
      courtCode: bookACourtHearing.courtCode,
      preHearingStartTime: formatDate(bookACourtHearing.preHearingStartTime, 'HH:mm'),
      preHearingEndTime: formatDate(bookACourtHearing.preHearingEndTime, 'HH:mm'),
      startTime: formatDate(bookACourtHearing.startTime, 'HH:mm'),
      endTime: formatDate(bookACourtHearing.endTime, 'HH:mm'),
      postHearingStartTime: formatDate(bookACourtHearing.postHearingStartTime, 'HH:mm'),
      postHearingEndTime: formatDate(bookACourtHearing.postHearingEndTime, 'HH:mm'),
      username: user?.username,
    }

    this.telemetryService.trackEvent('GetAlternativeRoomsForCourtBooking', eventToRecord)

    return res.render('pages/bookAVideoLink/court/selectAlternativeRooms', { availableSlots: locations })
  }

  public POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { startTime, endTime, dpsLocationKey } = req.body

    const meetingTimes = this.getMeetingTimes(
      parseISO(startTime.toISOString()),
      parseISO(endTime.toISOString()),
      req.session.journey.bookACourtHearing,
    )

    req.session.journey.bookACourtHearing = {
      ...req.session.journey.bookACourtHearing,
      preHearingStartTime: meetingTimes.preStartTime,
      preHearingEndTime: meetingTimes.preEndTime,
      preLocationCode: meetingTimes.preStartTime ? dpsLocationKey : undefined,
      startTime: meetingTimes.startTime,
      endTime: meetingTimes.endTime,
      postHearingStartTime: meetingTimes.postStartTime,
      postHearingEndTime: meetingTimes.postEndTime,
      postLocationCode: meetingTimes.postStartTime ? dpsLocationKey : undefined,
      locationCode: dpsLocationKey,
    }

    const journey = req.session.journey.bookACourtHearing

    const eventToRecord = {
      bookingDate: formatDate(journey.date, 'yyyy-MM-dd'),
      prisonCode: journey.prisoner?.prisonId,
      courtCode: journey.courtCode,
      preHearingStartTime: formatDate(journey.preHearingStartTime, 'HH:mm'),
      preHearingEndTime: formatDate(journey.preHearingEndTime, 'HH:mm'),
      startTime: formatDate(journey.startTime, 'HH:mm'),
      endTime: formatDate(journey.endTime, 'HH:mm'),
      locationCode: journey.locationCode,
      postHearingStartTime: formatDate(journey.postHearingStartTime, 'HH:mm'),
      postHearingEndTime: formatDate(journey.postHearingEndTime, 'HH:mm'),
      username: user?.username,
    }

    this.telemetryService.trackEvent('PostAlternativeRoomsForCourtBooking', eventToRecord)

    return res.redirect('check-booking')
  }

  private getMeetingTimes(startTime: Date, endTime: Date, journey: BookACourtHearingJourney) {
    return {
      preStartTime: journey.preHearingStartTime != null ? startTime.toISOString() : undefined,
      preEndTime: journey.preHearingEndTime != null ? addMinutes(startTime, 15).toISOString() : undefined,
      startTime:
        journey.preHearingStartTime == null
          ? startTime.toISOString()
          : addMinutes(parseISO(startTime.toISOString()), 15).toISOString(),
      endTime:
        journey.postHearingStartTime == null
          ? endTime.toISOString()
          : subMinutes(parseISO(endTime.toISOString()), 15).toISOString(),
      postStartTime: journey.postHearingStartTime != null ? subMinutes(endTime, 15).toISOString() : undefined,
      postEndTime: journey.postHearingEndTime != null ? endTime.toISOString() : undefined,
    }
  }
}
