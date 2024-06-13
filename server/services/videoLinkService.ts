import { addDays, set, startOfToday, startOfTomorrow } from 'date-fns'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { AvailabilityRequest, CreateVideoBookingRequest } from '../@types/bookAVideoLinkApi/types'
import { BookAVideoLinkJourney } from '../routes/journeys/bookAVideoLink/journey'
import { dateAtTime, formatDate } from '../utils/utils'

export default class VideoLinkService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public async getCourtHearingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE', user)
  }

  public async getProbationMeetingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE', user)
  }

  public async getVideoLinkBookingById(id: number, user: Express.User) {
    return this.bookAVideoLinkApiClient.getVideoLinkBookingById(id, user)
  }

  public async checkAvailability(journey: BookAVideoLinkJourney, user: Express.User) {
    const formatInterval = (start: string, end: string) => ({
      start: formatDate(start, 'HH:mm'),
      end: formatDate(end, 'HH:mm'),
    })
    return this.bookAVideoLinkApiClient.checkAvailability(
      {
        bookingType: journey.type,
        courtOrProbationCode: journey.agencyCode,
        prisonCode: journey.prisoner.prisonId,
        date: formatDate(journey.date, 'yyyy-MM-dd'),
        preAppointment: journey.preLocationCode
          ? {
              prisonLocKey: journey.preLocationCode,
              interval: formatInterval(journey.preHearingStartTime, journey.preHearingEndTime),
            }
          : undefined,
        mainAppointment: {
          prisonLocKey: journey.locationCode,
          interval: formatInterval(journey.startTime, journey.endTime),
        },
        postAppointment: journey.postLocationCode
          ? {
              prisonLocKey: journey.postLocationCode,
              interval: formatInterval(journey.postHearingStartTime, journey.postHearingEndTime),
            }
          : undefined,
      } as AvailabilityRequest,
      user,
    )
  }

  public async createVideoLinkBooking(journey: BookAVideoLinkJourney, user: Express.User) {
    const createAppointment = (type: string, locationCode: string, date: string, startTime: string, endTime: string) =>
      locationCode
        ? {
            type,
            locationKey: locationCode,
            date: formatDate(date, 'yyyy-MM-dd'),
            startTime: formatDate(startTime, 'HH:mm'),
            endTime: formatDate(endTime, 'HH:mm'),
          }
        : undefined

    const appointments = [
      journey.type === 'COURT'
        ? createAppointment(
            'VLB_COURT_PRE',
            journey.preLocationCode,
            journey.date,
            journey.preHearingStartTime,
            journey.preHearingEndTime,
          )
        : undefined,
      journey.type === 'COURT'
        ? createAppointment('VLB_COURT_MAIN', journey.locationCode, journey.date, journey.startTime, journey.endTime)
        : undefined,
      journey.type === 'COURT'
        ? createAppointment(
            'VLB_COURT_POST',
            journey.postLocationCode,
            journey.date,
            journey.postHearingStartTime,
            journey.postHearingEndTime,
          )
        : undefined,
      journey.type === 'PROBATION'
        ? createAppointment('VLB_PROBATION', journey.locationCode, journey.date, journey.startTime, journey.endTime)
        : undefined,
    ].filter(Boolean)

    const request = {
      bookingType: journey.type,
      prisoners: [
        {
          // TODO: The journey object currently assumes that there is only 1 prisoner associated with a booking.
          //  It does not cater for co-defendants at different prisons
          prisonCode: journey.prisoner.prisonId,
          prisonerNumber: journey.prisoner.prisonerNumber,
          appointments,
        },
      ],
      courtCode: journey.type === 'COURT' ? journey.agencyCode : undefined,
      courtHearingType: journey.type === 'COURT' ? journey.hearingTypeCode : undefined,
      probationTeamCode: journey.type === 'PROBATION' ? journey.agencyCode : undefined,
      probationMeetingType: journey.type === 'PROBATION' ? journey.hearingTypeCode : undefined,
      comments: journey.comments,
      videoLinkUrl: journey.videoLinkUrl,
    } as CreateVideoBookingRequest

    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }

  public prisonShouldBeWarnedOfBooking(dateOfBooking: Date, timeOfBooking: Date): boolean {
    const now = new Date()
    const exactTimeOfBooking = dateAtTime(dateOfBooking, timeOfBooking)
    const todayAt3PM = set(startOfToday(), { hours: 15 })
    const twoDaysFromNow = addDays(startOfToday(), 2)

    return exactTimeOfBooking < startOfTomorrow() || (now > todayAt3PM && exactTimeOfBooking < twoDaysFromNow)
  }
}
