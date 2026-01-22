import { addDays, set, startOfToday, startOfTomorrow } from 'date-fns'
import _ from 'lodash'
import express from 'express'
import BookAVideoLinkApiClient, { PaginatedBookingsRequest } from '../data/bookAVideoLinkApiClient'
import { Location, PagedModelScheduleItem, ScheduleItem } from '../@types/bookAVideoLinkApi/types'
import { dateAtTime } from '../utils/utils'
import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import { Prisoner } from '../@types/prisonerOffenderSearchApi/types'

export default class VideoLinkService {
  constructor(
    private readonly bookAVideoLinkApiClient: BookAVideoLinkApiClient,
    private readonly prisonerOffenderSearchApiClient: PrisonerOffenderSearchApiClient,
  ) {}

  public getVideoLinkBookingById(id: number, user: Express.User) {
    return this.bookAVideoLinkApiClient.getVideoLinkBookingById(id, user)
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
    const selfServicePrisonCodes = await this.bookAVideoLinkApiClient
      .getPrisons(true, user)
      .then(prisons => prisons.map(p => p.code))
    const appointments = await this.bookAVideoLinkApiClient
      .getVideoLinkSchedule(agencyType, agencyCode, date, user)
      .then(app => app.filter(a => selfServicePrisonCodes.includes(a.prisonCode)))

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

  public async getPaginatedMultipleAgenciesVideoLinkSchedules(
    paginatedBookingsRequest: PaginatedBookingsRequest,
    user: Express.User,
  ): Promise<PagedModelScheduleItem> {
    return this.bookAVideoLinkApiClient.getPaginatedMultipleAgenciesVideoLinkSchedules(paginatedBookingsRequest, user)
  }

  public async getUnpaginatedMultipleAgenciesVideoLinkSchedules(
    agencyType: 'court' | 'probation',
    agencyCodes: string[],
    date: Date,
    user: Express.User,
  ): Promise<ScheduleItem[]> {
    return this.bookAVideoLinkApiClient.getUnpaginatedMultipleAgenciesVideoLinkSchedules(
      agencyType,
      agencyCodes,
      date,
      user,
    )
  }

  public async downloadBookingDataByHearingDate(
    agencyType: 'court' | 'probation',
    date: Date,
    daysToExtract: number,
    response: express.Response,
    user: Express.User,
  ): Promise<void> {
    if (agencyType === 'court') {
      return this.bookAVideoLinkApiClient.downloadCourtDataByHearingDate(date, daysToExtract, response, user)
    }
    return this.bookAVideoLinkApiClient.downloadProbationDataByMeetingDate(date, daysToExtract, response, user)
  }

  public async downloadBookingDataByBookingDate(
    agencyType: 'court' | 'probation',
    date: Date,
    daysToExtract: number,
    response: express.Response,
    user: Express.User,
  ): Promise<void> {
    if (agencyType === 'court') {
      return this.bookAVideoLinkApiClient.downloadCourtDataByBookingDate(date, daysToExtract, response, user)
    }
    return this.bookAVideoLinkApiClient.downloadProbationDataByBookingDate(date, daysToExtract, response, user)
  }

  public async downloadPrisonRoomConfigurationData(response: express.Response, user: Express.User): Promise<void> {
    return this.bookAVideoLinkApiClient.downloadPrisonRoomConfigurationData(response, user)
  }

  private async fetchPrisonLocations(prisonCodes: string[], user: Express.User) {
    return Promise.all(
      prisonCodes.map(code => this.bookAVideoLinkApiClient.getAppointmentLocations(code, false, user)),
    ).then(responses => responses.flat())
  }

  private findPrisonerName(prisoners: Prisoner[], prisonerNumber: string) {
    const prisoner = prisoners.find(p => p.prisonerNumber === prisonerNumber)
    return prisoner ? `${prisoner.firstName} ${prisoner.lastName}` : ''
  }

  private findPrisonLocationDescription(prisonLocations: Location[], prisonLocKey: string) {
    return prisonLocations.find(loc => loc.key === prisonLocKey)?.description ?? ''
  }
}
