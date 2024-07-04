import { addDays, set, startOfToday, startOfTomorrow } from 'date-fns'
import _ from 'lodash'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import {
  AmendVideoBookingRequest,
  AvailabilityRequest,
  CreateVideoBookingRequest,
  Location,
  RequestVideoBookingRequest,
  ScheduleItem,
} from '../@types/bookAVideoLinkApi/types'
import { BookAVideoLinkJourney } from '../routes/journeys/bookAVideoLink/journey'
import { dateAtTime, formatDate } from '../utils/utils'
import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import { Prisoner } from '../@types/prisonerOffenderSearchApi/types'

type VideoBookingRequest = CreateVideoBookingRequest | AmendVideoBookingRequest | RequestVideoBookingRequest

export default class VideoLinkService {
  constructor(
    private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient,
    private readonly prisonerOffenderSearchApiClient: PrisonerOffenderSearchApiClient,
  ) {}

  public getCourtHearingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('COURT_HEARING_TYPE', user)
  }

  public getProbationMeetingTypes(user: Express.User) {
    return this.bookAVideoLinkApiClient.getReferenceCodesForGroup('PROBATION_MEETING_TYPE', user)
  }

  public getVideoLinkBookingById(id: number, user: Express.User) {
    return this.bookAVideoLinkApiClient.getVideoLinkBookingById(id, user)
  }

  public checkAvailability(journey: BookAVideoLinkJourney, user: Express.User) {
    const availabilityRequest = this.buildAvailabilityRequest(journey)
    return this.bookAVideoLinkApiClient.checkAvailability(availabilityRequest, user)
  }

  public createVideoLinkBooking(journey: BookAVideoLinkJourney, user: Express.User) {
    const request = this.buildBookingRequest<CreateVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.createVideoLinkBooking(request, user)
  }

  public requestVideoLinkBooking(journey: BookAVideoLinkJourney, user: Express.User) {
    const request = this.buildBookingRequest<RequestVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.requestVideoLinkBooking(request, user)
  }

  public amendVideoLinkBooking(journey: BookAVideoLinkJourney, user: Express.User) {
    const request = this.buildBookingRequest<AmendVideoBookingRequest>(journey)
    return this.bookAVideoLinkApiClient.amendVideoLinkBooking(journey.bookingId, request, user)
  }

  public cancelVideoLinkBooking(videoLinkBookingId: number, user: Express.User) {
    return this.bookAVideoLinkApiClient.cancelVideoLinkBooking(videoLinkBookingId, user)
  }

  public prisonShouldBeWarnedOfBooking(dateOfBooking: Date, timeOfBooking: Date): boolean {
    const now = new Date()
    const exactTimeOfBooking = dateAtTime(dateOfBooking, timeOfBooking)
    const todayAt3PM = set(startOfToday(), { hours: 15 })
    const twoDaysFromNow = addDays(startOfToday(), 2)

    return exactTimeOfBooking < startOfTomorrow() || (now > todayAt3PM && exactTimeOfBooking < twoDaysFromNow)
  }

  public bookingIsAmendable(dateOfBooking: Date, timeOfBooking: Date, bookingStatus: string): boolean {
    const now = new Date()
    const exactTimeOfBooking = dateAtTime(dateOfBooking, timeOfBooking)
    return bookingStatus !== 'CANCELLED' && exactTimeOfBooking > now
  }

  public async getVideoLinkSchedule(
    agencyType: 'court' | 'probation',
    agencyCode: string,
    date: Date,
    user: Express.User,
  ): Promise<(ScheduleItem & { prisonerName: string; prisonLocationDescription: string })[]> {
    const appointments = await this.bookAVideoLinkApiClient.getVideoLinkSchedule(agencyType, agencyCode, date, user)

    const prisonCodes = _.uniq(appointments.map(a => a.prisonCode))
    const prisonLocations = await this.fetchPrisonLocations(prisonCodes, user)

    const prisonerNumbers = _.uniq(appointments.map(a => a.prisonerNumber))
    const prisoners = await this.prisonerOffenderSearchApiClient.getByPrisonerNumbers(prisonerNumbers, user)

    return appointments.map(a => ({
      ...a,
      prisonerName: this.findPrisonerName(prisoners, a.prisonerNumber),
      prisonLocationDescription: this.findPrisonLocationDescription(prisonLocations, a.prisonLocKey),
    }))
  }

  private buildAvailabilityRequest(journey: BookAVideoLinkJourney): AvailabilityRequest {
    const formatInterval = (start: string, end: string) => ({
      start: formatDate(start, 'HH:mm'),
      end: formatDate(end, 'HH:mm'),
    })

    return {
      vlbIdToExclude: journey.bookingId,
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
    } as AvailabilityRequest
  }

  private buildBookingRequest<T extends VideoBookingRequest>(journey: BookAVideoLinkJourney): T {
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
      courtCode: journey.type === 'COURT' ? journey.agencyCode : undefined,
      courtHearingType: journey.type === 'COURT' ? journey.hearingTypeCode : undefined,
      probationTeamCode: journey.type === 'PROBATION' ? journey.agencyCode : undefined,
      probationMeetingType: journey.type === 'PROBATION' ? journey.hearingTypeCode : undefined,
      comments: journey.comments,
      videoLinkUrl: journey.videoLinkUrl,
    } as unknown as T
  }

  private async fetchPrisonLocations(prisonCodes: string[], user: Express.User) {
    return Promise.all(prisonCodes.map(code => this.bookAVideoLinkApiClient.getAppointmentLocations(code, user))).then(
      responses => responses.flat(),
    )
  }

  private findPrisonerName(prisoners: Prisoner[], prisonerNumber: string) {
    const prisoner = prisoners.find(p => p.prisonerNumber === prisonerNumber)
    return prisoner ? `${prisoner.firstName} ${prisoner.lastName}` : ''
  }

  private findPrisonLocationDescription(prisonLocations: Location[], prisonLocKey: string) {
    return prisonLocations.find(loc => loc.key === prisonLocKey)?.description ?? ''
  }

  private mapSessionToAppointments(journey: BookAVideoLinkJourney) {
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
