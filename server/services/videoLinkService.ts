import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { CreateVideoBookingRequest } from '../@types/bookAVideoLinkApi/types'
import { BookAVideoLinkJourney } from '../routes/journeys/bookAVideoLink/journey'
import { formatDate } from '../utils/utils'

export default class VideoLinkService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public async getCourtHearingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE', user)
  }

  public async getProbationMeetingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE', user)
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
        ? createAppointment(
            'VLB_COURT_PROBATION',
            journey.locationCode,
            journey.date,
            journey.startTime,
            journey.endTime,
          )
        : undefined,
    ].filter(Boolean)

    const request = {
      bookingType: journey.type,
      prisoners: [
        {
          prisonCode: journey.prisoner.prisonId,
          prisonerNumber: journey.prisoner.prisonerNumber,
          appointments,
        },
      ],
      courtCode: journey.type === 'COURT' ? journey.agencyCode : null,
      courtHearingType: journey.type === 'COURT' ? journey.hearingType : null,
      probationTeamCode: journey.type === 'PROBATION' ? journey.agencyCode : null,
      probationMeetingType: journey.type === 'PROBATION' ? journey.hearingType : null,
      comments: journey.comments,
      videoLinkUrl: journey.videoLinkUrl,
    } as CreateVideoBookingRequest

    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }
}
