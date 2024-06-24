import config from '../config'
import RestClient from './restClient'
import {
  Court,
  Location,
  ProbationTeam,
  CreateVideoBookingRequest,
  ReferenceCode,
  Prison,
  VideoLinkBooking,
  AvailabilityRequest,
  AvailabilityResponse,
  ScheduleItem,
  AmendVideoBookingRequest,
} from '../@types/bookAVideoLinkApi/types'
import { formatDate } from '../utils/utils'

export default class BookAVideoLinkApiClient extends RestClient {
  constructor() {
    super('Book A Video Link API', config.apis.bookAVideoLinkApi)
  }

  public getAllEnabledCourts(user: Express.User): Promise<Court[]> {
    return this.get({ path: '/courts/enabled' }, user)
  }

  public getUserCourtPreferences(user: Express.User): Promise<Court[]> {
    return this.get({ path: '/courts/user-preferences' }, user)
  }

  public setUserCourtPreferences(courtCodes: string[], user: Express.User): Promise<void> {
    return this.post(
      {
        path: `/courts/user-preferences/set`,
        data: {
          courtCodes,
        },
      },
      user,
    )
  }

  public getAllEnabledProbationTeams(user: Express.User): Promise<ProbationTeam[]> {
    return this.get({ path: '/probation-teams/enabled' }, user)
  }

  public getUserProbationTeamPreferences(user: Express.User): Promise<ProbationTeam[]> {
    return this.get({ path: '/probation-teams/user-preferences' }, user)
  }

  public setUserProbationTeamPreferences(probationTeamCodes: string[], user: Express.User): Promise<void> {
    return this.post(
      {
        path: `/probation-teams/user-preferences/set`,
        data: {
          probationTeamCodes,
        },
      },
      user,
    )
  }

  public getAppointmentLocations(prisonCode: string, user: Express.User): Promise<Location[]> {
    return this.get({ path: `/prisons/${prisonCode}/locations` }, user)
  }

  public getPrisons(enabledOnly: boolean, user: Express.User): Promise<Prison[]> {
    return this.get(
      {
        path: `/prisons/list`,
        query: {
          enabledOnly,
        },
      },
      user,
    )
  }

  public getReferenceCodesForGroup(groupCode: string, user: Express.User): Promise<ReferenceCode[]> {
    return this.get({ path: `/reference-codes/group/${groupCode}` }, user)
  }

  public getVideoLinkBookingById(id: number, user: Express.User): Promise<VideoLinkBooking> {
    return this.get({ path: `/video-link-booking/id/${id}` }, user)
  }

  public checkAvailability(request: AvailabilityRequest, user: Express.User): Promise<AvailabilityResponse> {
    return this.post({ path: '/availability', data: request }, user)
  }

  public createVideoLinkBooking(request: CreateVideoBookingRequest, user: Express.User): Promise<number> {
    return this.post({ path: '/video-link-booking', data: request }, user)
  }

  public amendVideoLinkBooking(
    videoBookingId: number,
    request: AmendVideoBookingRequest,
    user: Express.User,
  ): Promise<number> {
    return this.put({ path: `/video-link-booking/id/${videoBookingId}`, data: request }, user)
  }

  public cancelVideoLinkBooking(videoBookingId: number, user: Express.User): Promise<void> {
    return this.delete({ path: `/video-link-booking/id/${videoBookingId}` }, user)
  }

  public getVideoLinkSchedule(
    agencyType: 'court' | 'probation',
    agencyCode: string,
    date: Date,
    user: Express.User,
  ): Promise<ScheduleItem[]> {
    return this.get(
      { path: `/schedule/${agencyType}/${agencyCode}`, query: { date: formatDate(date, 'yyyy-MM-dd') } },
      user,
    )
  }
}
