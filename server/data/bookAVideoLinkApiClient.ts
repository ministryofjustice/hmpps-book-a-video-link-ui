import express from 'express'
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
  RequestVideoBookingRequest,
  AvailableLocationsResponse,
  TimeSlotAvailabilityRequest,
  DateTimeAvailabilityRequest,
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  AmendDecoratedRoomRequest,
  AmendRoomScheduleRequest,
  RoomSchedule,
} from '../@types/bookAVideoLinkApi/types'

import { formatDate } from '../utils/utils'

export default class BookAVideoLinkApiClient extends RestClient {
  constructor() {
    super('Book A Video Link API', config.apis.bookAVideoLinkApi)
  }

  public getAllEnabledCourts(user: Express.User): Promise<Court[]> {
    return this.get({ path: '/courts', query: { enabledOnly: true } }, user)
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
    return this.get({ path: '/probation-teams', query: { enabledOnly: true } }, user)
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

  public getAppointmentLocations(prisonCode: string, videoLinkOnly: boolean, user: Express.User): Promise<Location[]> {
    return this.get({ path: `/prisons/${prisonCode}/locations`, query: { videoLinkOnly } }, user)
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

  public fetchAvailableLocations(
    request: TimeSlotAvailabilityRequest,
    user: Express.User,
  ): Promise<AvailableLocationsResponse> {
    return this.post({ path: '/availability/by-time-slot', data: request }, user)
  }

  public fetchAvailableLocationsByDateAndTime(
    request: DateTimeAvailabilityRequest,
    user: Express.User,
  ): Promise<AvailableLocationsResponse> {
    return this.post({ path: '/availability/by-date-and-time', data: request }, user)
  }

  public createVideoLinkBooking(request: CreateVideoBookingRequest, user: Express.User): Promise<number> {
    return this.post({ path: '/video-link-booking', data: request }, user)
  }

  public requestVideoLinkBooking(request: RequestVideoBookingRequest, user: Express.User): Promise<void> {
    return this.post({ path: '/video-link-booking/request', data: request }, user)
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

  public downloadCourtDataByHearingDate(
    date: Date,
    days: number,
    response: express.Response,
    user: Express.User,
  ): Promise<void> {
    return this.pipeFileStream(
      {
        path: `/download-csv/court-data-by-hearing-date`,
        query: { 'start-date': formatDate(date, 'yyyy-MM-dd'), days },
      },
      response,
      user,
    )
  }

  public downloadCourtDataByBookingDate(
    date: Date,
    days: number,
    response: express.Response,
    user: Express.User,
  ): Promise<void> {
    return this.pipeFileStream(
      {
        path: '/download-csv/court-data-by-booking-date',
        query: { 'start-date': formatDate(date, 'yyyy-MM-dd'), days },
      },
      response,
      user,
    )
  }

  public downloadProbationDataByMeetingDate(
    date: Date,
    days: number,
    response: express.Response,
    user: Express.User,
  ): Promise<void> {
    return this.pipeFileStream(
      {
        path: `/download-csv/probation-data-by-meeting-date`,
        query: { 'start-date': formatDate(date, 'yyyy-MM-dd'), days },
      },
      response,
      user,
    )
  }

  public downloadProbationDataByBookingDate(
    date: Date,
    days: number,
    response: express.Response,
    user: Express.User,
  ): Promise<void> {
    return this.pipeFileStream(
      {
        path: '/download-csv/probation-data-by-booking-date',
        query: { 'start-date': formatDate(date, 'yyyy-MM-dd'), days },
      },
      response,
      user,
    )
  }

  public getLocationByDpsLocationId(dpsLocationId: string, user: Express.User): Promise<Location> {
    return this.get({ path: `/room-admin/${dpsLocationId}` }, user)
  }

  public createRoomAttributes(
    dpsLocationId: string,
    request: CreateDecoratedRoomRequest,
    user: Express.User,
  ): Promise<Location> {
    return this.post({ path: `/room-admin/${dpsLocationId}`, data: request }, user)
  }

  public amendRoomAttributes(
    dpsLocationId: string,
    request: AmendDecoratedRoomRequest,
    user: Express.User,
  ): Promise<Location> {
    return this.put({ path: `/room-admin/${dpsLocationId}`, data: request }, user)
  }

  public deleteRoomAttributesAndSchedules(dpsLocationId: string, user: Express.User): Promise<Location> {
    return this.delete({ path: `/room-admin/${dpsLocationId}` }, user)
  }

  public createRoomSchedule(
    dpsLocationId: string,
    request: CreateRoomScheduleRequest,
    user: Express.User,
  ): Promise<RoomSchedule> {
    return this.post({ path: `/room-admin/${dpsLocationId}/schedule`, data: request }, user)
  }

  public amendRoomSchedule(
    dpsLocationId: string,
    scheduleId: number,
    request: AmendRoomScheduleRequest,
    user: Express.User,
  ): Promise<RoomSchedule> {
    return this.put({ path: `/room-admin/${dpsLocationId}/schedule/${scheduleId}`, data: request }, user)
  }

  public deleteRoomSchedule(dpsLocationId: string, scheduleId: number, user: Express.User): Promise<Location> {
    return this.delete({ path: `/room-admin/${dpsLocationId}/schedule/${scheduleId}` }, user)
  }
}
