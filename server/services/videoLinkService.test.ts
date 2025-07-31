import sinon from 'sinon'
import express from 'express'
import { startOfToday } from 'date-fns'
import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import VideoLinkService from './videoLinkService'
import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import { Location, Prison, ScheduleItem, VideoLinkBooking } from '../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../@types/prisonerOffenderSearchApi/types'

jest.mock('../data/bookAVideoLinkApiClient')
jest.mock('../data/prisonerOffenderSearchApiClient')

describe('Video link service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let prisonerOffenderSearchClient: jest.Mocked<PrisonerOffenderSearchApiClient>
  let videoLinkService: VideoLinkService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    prisonerOffenderSearchClient = new PrisonerOffenderSearchApiClient() as jest.Mocked<PrisonerOffenderSearchApiClient>
    videoLinkService = new VideoLinkService(bookAVideoLinkClient, prisonerOffenderSearchClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getVideoLinkBookingById', () => {
    it('Retrieves a video link booking by ID', async () => {
      bookAVideoLinkClient.getVideoLinkBookingById.mockResolvedValue({ videoLinkBookingId: 1 } as VideoLinkBooking)
      const result = await videoLinkService.getVideoLinkBookingById(1, user)
      expect(bookAVideoLinkClient.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(result).toEqual({ videoLinkBookingId: 1 })
    })
  })

  describe('cancelVideoLinkBooking', () => {
    it('calls the cancel booking endpoint', async () => {
      await videoLinkService.cancelVideoLinkBooking(1, user)
      expect(bookAVideoLinkClient.cancelVideoLinkBooking).toHaveBeenCalledWith(1, user)
    })
  })

  describe('prisonShouldBeWarnedOfBooking', () => {
    let clock: sinon.SinonFakeTimers

    afterEach(() => {
      if (clock) {
        clock.restore()
      }
    })

    it('should return true if booking is today before tomorrow', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-10T10:00:00Z').getTime())
      const dateOfBooking = new Date('2024-06-10')
      const timeOfBooking = new Date('2024-06-10T14:00:00Z')
      expect(videoLinkService.prisonShouldBeWarnedOfBooking(dateOfBooking, timeOfBooking)).toBe(true)
    })

    it('should return true if booking is tomorrow but "now" is past 3 PM', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-10T16:00:00Z').getTime())
      const dateOfBooking = new Date('2024-06-11')
      const timeOfBooking = new Date('2024-06-11T14:00:00Z')
      expect(videoLinkService.prisonShouldBeWarnedOfBooking(dateOfBooking, timeOfBooking)).toBe(true)
    })

    it('should return false if booking is tomorrow but "now" is before 3 PM', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-10T14:00:00Z').getTime())
      const dateOfBooking = new Date('2024-06-11')
      const timeOfBooking = new Date('2024-06-11T14:00:00Z')
      expect(videoLinkService.prisonShouldBeWarnedOfBooking(dateOfBooking, timeOfBooking)).toBe(false)
    })

    it('should return false if booking is more than two days away', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-10T14:00:00Z').getTime())
      const dateOfBooking = new Date('2024-06-13')
      const timeOfBooking = new Date('2024-06-13T14:00:00Z')
      expect(videoLinkService.prisonShouldBeWarnedOfBooking(dateOfBooking, timeOfBooking)).toBe(false)
    })

    it('should handle edge cases of exact boundary times correctly', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-10T15:00:00Z').getTime())
      const dateOfBooking1 = new Date('2024-06-11')
      const timeOfBooking1 = new Date('2024-06-11T00:00:00Z')
      expect(videoLinkService.prisonShouldBeWarnedOfBooking(dateOfBooking1, timeOfBooking1)).toBe(false)

      clock.restore()
      clock = sinon.useFakeTimers(new Date('2024-06-10T14:59:00Z').getTime())
      const dateOfBooking2 = new Date('2024-06-11')
      const timeOfBooking2 = new Date('2024-06-11T00:00:00Z')
      expect(videoLinkService.prisonShouldBeWarnedOfBooking(dateOfBooking2, timeOfBooking2)).toBe(false)
    })
  })

  describe('bookingIsAmendable', () => {
    let clock: sinon.SinonFakeTimers

    afterEach(() => {
      if (clock) {
        clock.restore()
      }
    })

    it('returns false if booking status is "CANCELLED"', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-25T12:00:00Z').getTime())

      const dateOfBooking = new Date('2024-06-26')
      const timeOfBooking = new Date('2024-06-26T14:00:00Z')
      const bookingStatus = 'CANCELLED'

      expect(videoLinkService.bookingIsAmendable(dateOfBooking, timeOfBooking, bookingStatus)).toBe(false)
    })

    it('returns false if booking is in the past', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-26T15:00:00Z').getTime())

      const dateOfBooking = new Date('2024-06-26')
      const timeOfBooking = new Date('2024-06-26T14:00:00Z')
      const bookingStatus = 'ACTIVE'

      expect(videoLinkService.bookingIsAmendable(dateOfBooking, timeOfBooking, bookingStatus)).toBe(false)
    })

    it('returns true if booking is in the future', () => {
      clock = sinon.useFakeTimers(new Date('2024-06-26T13:00:00Z').getTime())

      const dateOfBooking = new Date('2024-06-26')
      const timeOfBooking = new Date('2024-06-26T14:00:00Z')
      const bookingStatus = 'ACTIVE'

      expect(videoLinkService.bookingIsAmendable(dateOfBooking, timeOfBooking, bookingStatus)).toBe(true)
    })
  })

  describe('getVideoLinkSchedule', () => {
    it('should fetch the video link schedule for self service prisons only', async () => {
      bookAVideoLinkClient.getPrisons.mockResolvedValue([{ code: 'BMI' }, { code: 'WWI' }] as Prison[])
      bookAVideoLinkClient.getVideoLinkSchedule.mockResolvedValue([
        { videoBookingId: 1, prisonCode: 'BMI', prisonerNumber: 'ABC123', prisonLocKey: 'LOC1' },
        { videoBookingId: 2, prisonCode: 'MDI', prisonerNumber: 'ZYX321', prisonLocKey: 'LOC2' },
      ] as ScheduleItem[])
      bookAVideoLinkClient.getAppointmentLocations.mockResolvedValue([
        { key: 'LOC1', description: 'Location 1' },
      ] as Location[])
      prisonerOffenderSearchClient.getByPrisonerNumbers.mockResolvedValue([
        { prisonerNumber: 'ABC123', firstName: 'Joe', lastName: 'Bloggs' },
      ] as Prisoner[])

      const result = await videoLinkService.getVideoLinkSchedule('court', 'agency1', startOfToday(), user)

      expect(result).toEqual([
        {
          videoBookingId: 1,
          prisonCode: 'BMI',
          prisonLocKey: 'LOC1',
          prisonLocationDescription: 'Location 1',
          prisonerName: 'Joe Bloggs',
          prisonerNumber: 'ABC123',
        },
      ])
      expect(bookAVideoLinkClient.getVideoLinkSchedule).toHaveBeenCalledWith('court', 'agency1', startOfToday(), user)
    })
  })

  describe('downloadBookingDataByHearingDate', () => {
    it('Requests the court csv stream to be piped into the response', async () => {
      const date = new Date(2024, 1, 2)
      const res = {} as unknown as express.Response
      await videoLinkService.downloadBookingDataByHearingDate('court', date, 7, res, user)
      expect(bookAVideoLinkClient.downloadCourtDataByHearingDate).toHaveBeenCalledWith(date, 7, res, user)
    })

    it('Requests the probation csv stream to be piped into the response', async () => {
      const date = new Date(2024, 1, 2)
      const res = {} as unknown as express.Response
      await videoLinkService.downloadBookingDataByHearingDate('probation', date, 7, res, user)
      expect(bookAVideoLinkClient.downloadProbationDataByMeetingDate).toHaveBeenCalledWith(date, 7, res, user)
    })
  })

  describe('downloadBookingDataByBookingDate', () => {
    it('Requests the court csv stream to be piped into the response', async () => {
      const date = new Date(2024, 1, 2)
      const res = {} as unknown as express.Response
      await videoLinkService.downloadBookingDataByBookingDate('court', date, 7, res, user)
      expect(bookAVideoLinkClient.downloadCourtDataByBookingDate).toHaveBeenCalledWith(date, 7, res, user)
    })

    it('Requests the probation csv stream to be piped into the response', async () => {
      const date = new Date(2024, 1, 2)
      const res = {} as unknown as express.Response
      await videoLinkService.downloadBookingDataByBookingDate('probation', date, 7, res, user)
      expect(bookAVideoLinkClient.downloadProbationDataByBookingDate).toHaveBeenCalledWith(date, 7, res, user)
    })
  })

  describe('downloadPrisonRoomConfigurationData', () => {
    it('Requests the prison room configuration data to be piped into the response', async () => {
      const res = {} as unknown as express.Response
      await videoLinkService.downloadPrisonRoomConfigurationData(res, user)
      expect(bookAVideoLinkClient.downloadPrisonRoomConfigurationData).toHaveBeenCalledWith(res, user)
    })
  })
})
