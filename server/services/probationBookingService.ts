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
      bookingType: journey.type,
      courtOrProbationCode: journey.courtCode,
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
    } as AvailabilityRequest
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookAProbationMeetingJourney): T {
    return {
      bookingType: journey.type,
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
      courtCode: journey.type === 'COURT' ? journey.courtCode : undefined,
      courtHearingType: journey.type === 'COURT' ? journey.hearingTypeCode : undefined,
      probationTeamCode: journey.type === 'PROBATION' ? journey.courtCode : undefined,
      probationMeetingType: journey.type === 'PROBATION' ? journey.hearingTypeCode : undefined,
      comments: journey.comments,
      videoLinkUrl: journey.type === 'COURT' ? journey.videoLinkUrl : undefined,
    } as unknown as T
  }

  private mapSessionToAppointments(journey: BookAProbationMeetingJourney) {
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

    return [
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
  }
}
