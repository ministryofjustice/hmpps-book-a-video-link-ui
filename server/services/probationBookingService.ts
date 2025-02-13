import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import {
  AmendVideoBookingRequest,
  AvailabilityRequest,
  CreateVideoBookingRequest,
  RequestVideoBookingRequest,
} from '../@types/bookAVideoLinkApi/types'
import { formatDate } from '../utils/utils'
import { BookAProbationMeetingJourney } from '../routes/journeys/bookAVideoLink/probation/journey'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest | RequestVideoBookingRequest

export default class ProbationBookingService {
  constructor(private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient) {}

  public checkAvailability(journey: BookAProbationMeetingJourney, user: Express.User) {
    const availabilityRequest = this.buildAvailabilityRequest(journey)
    return this.bookAVideoLinkApiClient.checkAvailability(availabilityRequest, user)
  }

  public createVideoLinkBooking(journey: BookAProbationMeetingJourney, user: Express.User) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }

  public requestVideoLinkBooking(journey: BookAProbationMeetingJourney, user: Express.User) {
    const request = this.buildBookingRequest<RequestVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.requestVideoLinkBooking(request, user)
  }

  public amendVideoLinkBooking(journey: BookAProbationMeetingJourney, user: Express.User) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request, user)
  }

  private buildAvailabilityRequest(journey: BookAProbationMeetingJourney): AvailabilityRequest {
    const formatInterval = (start: string, end: string) => ({
      start: formatDate(start, 'HH:mm'),
      end: formatDate(end, 'HH:mm'),
    })

    return {
      vlbIdToExclude: journey.bookingId,
      bookingType: 'PROBATION',
      courtOrProbationCode: journey.probationTeamCode,
      prisonCode: journey.prisoner.prisonId,
      date: formatDate(journey.date, 'yyyy-MM-dd'),
      mainAppointment: {
        prisonLocKey: journey.locationCode,
        interval: formatInterval(journey.startTime, journey.endTime),
      },
    } as AvailabilityRequest
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookAProbationMeetingJourney): T {
    return {
      bookingType: 'PROBATION',
      prisoners: [
        {
          firstName: journey.prisoner.firstName,
          lastName: journey.prisoner.lastName,
          dateOfBirth: formatDate(journey.prisoner.dateOfBirth, 'yyyy-MM-dd'),
          prisonCode: journey.prisoner.prisonId,
          prisonerNumber: journey.prisoner.prisonerNumber,
          appointments: this.mapSessionToAppointments(journey),
        },
      ],
      probationTeamCode: journey.probationTeamCode,
      probationMeetingType: journey.meetingTypeCode,
      comments: journey.comments,
    } as unknown as T
  }

  private mapSessionToAppointments(journey: BookAProbationMeetingJourney) {
    return [
      {
        type: 'VLB_PROBATION',
        locationKey: journey.locationCode,
        date: formatDate(journey.date, 'yyyy-MM-dd'),
        startTime: formatDate(journey.startTime, 'HH:mm'),
        endTime: formatDate(journey.endTime, 'HH:mm'),
      },
    ]
  }
}
