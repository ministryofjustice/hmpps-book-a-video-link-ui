import nock from 'nock'
import express from 'express'
import { PassThrough } from 'stream'
import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import {
  AmendDecoratedRoomRequest,
  AmendRoomScheduleRequest,
  AmendVideoBookingRequest,
  AvailabilityRequest,
  TimeSlotAvailabilityRequest,
  CreateDecoratedRoomRequest,
  CreateRoomScheduleRequest,
  CreateVideoBookingRequest,
  Location,
  RequestVideoBookingRequest,
  RoomSchedule,
  DateTimeAvailabilityRequest,
} from '../@types/bookAVideoLinkApi/types'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

describe('bookAVideoLinkApiClient', () => {
  let fakeBookAVideoLinkApiClient: nock.Scope
  let bookAVideoLinkApiClient: BookAVideoLinkApiClient

  beforeEach(() => {
    fakeBookAVideoLinkApiClient = nock(config.apis.bookAVideoLinkApi.url)
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAllEnabledCourts', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/courts?enabledOnly=true')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAllEnabledCourts(user)
      expect(output).toEqual(response)
    })
  })

  describe('getUserCourtPreferences', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/courts/user-preferences')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getUserCourtPreferences(user)
      expect(output).toEqual(response)
    })
  })

  describe('setUserCourtPreferences', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/courts/user-preferences/set', { courtCodes: ['TEST'] })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.setUserCourtPreferences(['TEST'], user)
      expect(output).toEqual(response)
    })
  })

  describe('getAllEnabledProbationTeams', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/probation-teams?enabledOnly=true')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAllEnabledProbationTeams(user)
      expect(output).toEqual(response)
    })
  })

  describe('getUserProbationTeamPreferences', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/probation-teams/user-preferences')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getUserProbationTeamPreferences(user)
      expect(output).toEqual(response)
    })
  })

  describe('setUserProbationTeamPreferences', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/probation-teams/user-preferences/set', { probationTeamCodes: ['TEST'] })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.setUserProbationTeamPreferences(['TEST'], user)
      expect(output).toEqual(response)
    })
  })

  describe('getAppointmentLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/prisons/MDI/locations?videoLinkOnly=true')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAppointmentLocations('MDI', true, user)
      expect(output).toEqual(response)
    })
  })

  describe('getPrisons', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/prisons/list')
        .query({ enabledOnly: true })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getPrisons(true, user)
      expect(output).toEqual(response)
    })
  })

  describe('getReferenceCodesForGroup', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/reference-codes/group/GROUP')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getReferenceCodesForGroup('GROUP', user)
      expect(output).toEqual(response)
    })
  })

  describe('getVideoLinkBookingById', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/video-link-booking/id/1')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getVideoLinkBookingById(1, user)
      expect(output).toEqual(response)
    })
  })

  describe('checkAvailability', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/availability', { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.checkAvailability(
        { bookingType: 'COURT' } as AvailabilityRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('fetchAvailableLocations', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/availability/by-time-slot', { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.fetchAvailableLocations(
        { bookingType: 'COURT' } as TimeSlotAvailabilityRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('fetchAvailableLocationsByDateAndTime', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/availability/by-date-and-time', { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.fetchAvailableLocationsByDateAndTime(
        { bookingType: 'COURT' } as DateTimeAvailabilityRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('createVideoLinkBooking', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/video-link-booking', { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, response)

      const output = await bookAVideoLinkApiClient.createVideoLinkBooking(
        { bookingType: 'COURT' } as CreateVideoBookingRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('requestVideoLinkBooking', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/video-link-booking/request', { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.requestVideoLinkBooking(
        { bookingType: 'COURT' } as RequestVideoBookingRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('amendVideoLinkBooking', () => {
    it('should put the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .put(`/video-link-booking/id/1`, { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.amendVideoLinkBooking(
        1,
        { bookingType: 'COURT' } as AmendVideoBookingRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('cancelVideoLinkBooking', () => {
    it('call the cancel booking endpoint', async () => {
      fakeBookAVideoLinkApiClient
        .delete(`/video-link-booking/id/1`)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200)

      await bookAVideoLinkApiClient.cancelVideoLinkBooking(1, user)
    })
  })

  describe('getVideoLinkSchedule', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/schedule/court/ABERCV?date=2024-07-12')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getVideoLinkSchedule('court', 'ABERCV', new Date(2024, 6, 12), user)
      expect(output).toEqual(response)
    })
  })

  describe('downloadCourtDataByHearingDate', () => {
    it('should return data from api', async () => {
      fakeBookAVideoLinkApiClient
        .get('/download-csv/court-data-by-hearing-date?start-date=2024-02-02&days=7')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

      const res = new PassThrough() as unknown as express.Response
      res.set = jest.fn()

      await bookAVideoLinkApiClient.downloadCourtDataByHearingDate(new Date(2024, 1, 2), 7, res, user)

      res.on('data', chunk => {
        expect(chunk.toString()).toBe('file content')
      })

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('downloadCourtDataByBookingDate', () => {
    it('should return data from api', async () => {
      fakeBookAVideoLinkApiClient
        .get('/download-csv/court-data-by-booking-date?start-date=2024-02-02&days=7')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

      const res = new PassThrough() as unknown as express.Response
      res.set = jest.fn()

      await bookAVideoLinkApiClient.downloadCourtDataByBookingDate(new Date(2024, 1, 2), 7, res, user)

      res.on('data', chunk => {
        expect(chunk.toString()).toBe('file content')
      })

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('downloadProbationDataByMeetingDate', () => {
    it('should return data from api', async () => {
      fakeBookAVideoLinkApiClient
        .get('/download-csv/probation-data-by-meeting-date?start-date=2024-02-02&days=7')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

      const res = new PassThrough() as unknown as express.Response
      res.set = jest.fn()

      await bookAVideoLinkApiClient.downloadProbationDataByMeetingDate(new Date(2024, 1, 2), 7, res, user)

      res.on('data', chunk => {
        expect(chunk.toString()).toBe('file content')
      })

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('downloadProbationDataByBookingDate', () => {
    it('should return data from api', async () => {
      fakeBookAVideoLinkApiClient
        .get('/download-csv/probation-data-by-booking-date?start-date=2024-02-02&days=7')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, 'file content', { 'content-disposition': 'attachment; filename="file.txt"' })

      const res = new PassThrough() as unknown as express.Response
      res.set = jest.fn()

      await bookAVideoLinkApiClient.downloadProbationDataByBookingDate(new Date(2024, 1, 2), 7, res, user)

      res.on('data', chunk => {
        expect(chunk.toString()).toBe('file content')
      })

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('room administration endpoints', () => {
    it('should get a decorated location', async () => {
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'
      const response = { data: 'some room data' }
      fakeBookAVideoLinkApiClient
        .get(`/room-admin/${dpsLocationId}`)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getLocationByDpsLocationId(dpsLocationId, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    it('should create room decorations', async () => {
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'
      const request = {
        locationUsage: 'COURT',
        locationStatus: 'ACTIVE',
        prisonVideoUrl: 'link-1',
        comments: 'hello',
      } as CreateDecoratedRoomRequest

      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post(`/room-admin/${dpsLocationId}`, request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, response)

      const output: Location = await bookAVideoLinkApiClient.createRoomAttributes(dpsLocationId, request, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    it('should amend room decorations', async () => {
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'
      const request = {
        locationUsage: 'COURT',
        locationStatus: 'ACTIVE',
        prisonVideoUrl: 'link-1',
        comments: 'hello',
      } as AmendDecoratedRoomRequest

      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .put(`/room-admin/${dpsLocationId}`, request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output: Location = await bookAVideoLinkApiClient.amendRoomAttributes(dpsLocationId, request, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    it('should remove all room decorations and schedules', async () => {
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'
      fakeBookAVideoLinkApiClient
        .delete(`/room-admin/${dpsLocationId}`)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(204)

      await bookAVideoLinkApiClient.deleteRoomAttributesAndSchedules(dpsLocationId, user)

      expect(nock.isDone()).toBe(true)
    })

    it('should create a schedule within a decorated room', async () => {
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'
      const request = {
        locationUsage: 'PROBATION',
        startDayOfWeek: 1,
        endDayOfWeek: 2,
        startTime: '10:00',
        endTime: '12:00',
      } as CreateRoomScheduleRequest

      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post(`/room-admin/${dpsLocationId}/schedule`, request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(201, response)

      const output: RoomSchedule = await bookAVideoLinkApiClient.createRoomSchedule(dpsLocationId, request, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    it('should update a schedule for a decorated room', async () => {
      const scheduleId = 1
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'
      const request = {
        locationUsage: 'COURT',
        startDayOfWeek: 1,
        endDayOfWeek: 2,
        startTime: '10:00',
        endTime: '12:00',
        allowedParties: ['COURT1', 'COURT2'],
      } as AmendRoomScheduleRequest

      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .put(`/room-admin/${dpsLocationId}/schedule/${scheduleId}`, request)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output: RoomSchedule = await bookAVideoLinkApiClient.amendRoomSchedule(
        dpsLocationId,
        scheduleId,
        request,
        user,
      )

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    it('should remove schedule from a decorated room', async () => {
      const scheduleId = 1
      const dpsLocationId = 'aaaa-bbb-cccc-dddd'

      fakeBookAVideoLinkApiClient
        .delete(`/room-admin/${dpsLocationId}/schedule/${scheduleId}`)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(204)

      await bookAVideoLinkApiClient.deleteRoomSchedule(dpsLocationId, scheduleId, user)

      expect(nock.isDone()).toBe(true)
    })
  })
})
