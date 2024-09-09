import sinon from 'sinon'
import express from 'express'
import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import VideoLinkService from './videoLinkService'
import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import { ReferenceCode, VideoLinkBooking } from '../@types/bookAVideoLinkApi/types'
import { BookAVideoLinkJourney } from '../routes/journeys/bookAVideoLink/journey'

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

  describe('getCourtHearingTypes', () => {
    it('Retrieves court hearing types', async () => {
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue([
        { code: 'code', description: 'description' },
      ] as ReferenceCode[])
      const result = await videoLinkService.getCourtHearingTypes(user)
      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('COURT_HEARING_TYPE', user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })

  describe('getProbationMeetingTypes', () => {
    it('Retrieves probation meeting types', async () => {
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue([
        { code: 'code', description: 'description' },
      ] as ReferenceCode[])
      const result = await videoLinkService.getProbationMeetingTypes(user)
      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('PROBATION_MEETING_TYPE', user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })

  describe('getVideoLinkBookingById', () => {
    it('Retrieves a video link booking by ID', async () => {
      bookAVideoLinkClient.getVideoLinkBookingById.mockResolvedValue({ videoLinkBookingId: 1 } as VideoLinkBooking)
      const result = await videoLinkService.getVideoLinkBookingById(1, user)
      expect(bookAVideoLinkClient.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(result).toEqual({ videoLinkBookingId: 1 })
    })
  })

  describe('checkAvailability', () => {
    const commonJourney = {
      type: 'COURT',
      prisoner: {
        prisonId: 'MDI',
        prisonerNumber: 'ABC123',
        prisonName: 'Moorland',
        firstName: 'Joe',
        lastName: 'Bloggs',
      },
      date: '2022-03-20T00:00:00Z',
      locationCode: 'LOCATION_CODE',
      startTime: '1970-01-01T13:30:00Z',
      endTime: '1970-01-01T14:30:00Z',
      agencyCode: 'AGENCY_CODE',
    } as BookAVideoLinkJourney

    it('should correctly handle the case with only main appointment', async () => {
      const journey = { ...commonJourney }

      await videoLinkService.checkAvailability(journey, user)

      expect(bookAVideoLinkClient.checkAvailability).toHaveBeenCalledWith(
        {
          bookingType: 'COURT',
          courtOrProbationCode: 'AGENCY_CODE',
          date: '2022-03-20',
          prisonCode: 'MDI',
          mainAppointment: {
            prisonLocKey: 'LOCATION_CODE',
            interval: { start: '13:30', end: '14:30' },
          },
        },
        user,
      )
    })

    it('should correctly handle the case with pre and post appointments', async () => {
      const journey = {
        ...commonJourney,
        preLocationCode: 'PRE_LOC',
        preHearingStartTime: '1970-01-01T13:15:00Z',
        preHearingEndTime: '1970-01-01T13:30:00Z',
        postLocationCode: 'POST_LOC',
        postHearingStartTime: '1970-01-01T14:30:00Z',
        postHearingEndTime: '1970-01-01T14:45:00Z',
      }

      await videoLinkService.checkAvailability(journey, user)

      expect(bookAVideoLinkClient.checkAvailability).toHaveBeenCalledWith(
        {
          bookingType: 'COURT',
          courtOrProbationCode: 'AGENCY_CODE',
          date: '2022-03-20',
          prisonCode: 'MDI',
          preAppointment: {
            prisonLocKey: 'PRE_LOC',
            interval: { start: '13:15', end: '13:30' },
          },
          mainAppointment: {
            prisonLocKey: 'LOCATION_CODE',
            interval: { start: '13:30', end: '14:30' },
          },
          postAppointment: {
            prisonLocKey: 'POST_LOC',
            interval: { start: '14:30', end: '14:45' },
          },
        },
        user,
      )
    })

    it('should correctly handle the case with pre appointment only', async () => {
      const journey = {
        ...commonJourney,
        preLocationCode: 'PRE_LOC',
        preHearingStartTime: '1970-01-01T13:15:00Z',
        preHearingEndTime: '1970-01-01T13:30:00Z',
      }

      await videoLinkService.checkAvailability(journey, user)

      expect(bookAVideoLinkClient.checkAvailability).toHaveBeenCalledWith(
        {
          bookingType: 'COURT',
          courtOrProbationCode: 'AGENCY_CODE',
          date: '2022-03-20',
          prisonCode: 'MDI',
          preAppointment: {
            prisonLocKey: 'PRE_LOC',
            interval: { start: '13:15', end: '13:30' },
          },
          mainAppointment: {
            prisonLocKey: 'LOCATION_CODE',
            interval: { start: '13:30', end: '14:30' },
          },
        },
        user,
      )
    })

    it('should correctly handle the case with post appointment only', async () => {
      const journey = {
        ...commonJourney,
        postLocationCode: 'POST_LOC',
        postHearingStartTime: '1970-01-01T14:30:00Z',
        postHearingEndTime: '1970-01-01T14:45:00Z',
      }

      await videoLinkService.checkAvailability(journey, user)

      expect(bookAVideoLinkClient.checkAvailability).toHaveBeenCalledWith(
        {
          bookingType: 'COURT',
          courtOrProbationCode: 'AGENCY_CODE',
          date: '2022-03-20',
          prisonCode: 'MDI',
          mainAppointment: {
            prisonLocKey: 'LOCATION_CODE',
            interval: { start: '13:30', end: '14:30' },
          },
          postAppointment: {
            prisonLocKey: 'POST_LOC',
            interval: { start: '14:30', end: '14:45' },
          },
        },
        user,
      )
    })
  })

  describe('createVideoLinkBooking', () => {
    it('Posts a request to create a probation meeting booking', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

      const journey = {
        type: 'PROBATION',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'PROBATION_TEAM',
        hearingTypeCode: 'PSR',
        comments: 'comments',
      } as BookAVideoLinkJourney

      const expectedBody = {
        bookingType: 'PROBATION',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_PROBATION',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        probationTeamCode: 'PROBATION_TEAM',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      const result = await videoLinkService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })

    it('Posts a request to create a court hearing booking only', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

      const journey = {
        type: 'COURT',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      } as BookAVideoLinkJourney

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      const result = await videoLinkService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })

    it('Posts a request to create a court hearing booking with a pre/post meeting', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

      const journey = {
        type: 'COURT',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        preLocationCode: 'PRE_LOCATION',
        preHearingStartTime: '1970-01-01T13:15:00Z',
        preHearingEndTime: '1970-01-01T13:30:00Z',
        postLocationCode: 'POST_LOCATION',
        postHearingStartTime: '1970-01-01T14:30:00Z',
        postHearingEndTime: '1970-01-01T14:45:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      } as BookAVideoLinkJourney

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_PRE',
                locationKey: 'PRE_LOCATION',
                date: '2022-03-20',
                startTime: '13:15',
                endTime: '13:30',
              },
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
              {
                type: 'VLB_COURT_POST',
                locationKey: 'POST_LOCATION',
                date: '2022-03-20',
                startTime: '14:30',
                endTime: '14:45',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      const result = await videoLinkService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })
  })

  describe('requestVideoLinkBooking', () => {
    it('Posts a request to create a probation meeting booking', async () => {
      const journey = {
        type: 'PROBATION',
        prisoner: {
          prisonId: 'MDI',
          prisonName: 'Moorland',
          firstName: 'Joe',
          lastName: 'Bloggs',
          dateOfBirth: '1970-01-01',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'PROBATION_TEAM',
        hearingTypeCode: 'PSR',
        comments: 'comments',
      }

      const expectedBody = {
        bookingType: 'PROBATION',
        prisoners: [
          {
            prisonCode: 'MDI',
            firstName: 'Joe',
            lastName: 'Bloggs',
            dateOfBirth: '1970-01-01',
            appointments: [
              {
                type: 'VLB_PROBATION',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        probationTeamCode: 'PROBATION_TEAM',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      await videoLinkService.requestVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.requestVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
    })

    it('Posts a request to create a court hearing booking only', async () => {
      const journey = {
        type: 'COURT',
        prisoner: {
          prisonId: 'MDI',
          prisonName: 'Moorland',
          firstName: 'Joe',
          lastName: 'Bloggs',
          dateOfBirth: '1970-01-01',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            firstName: 'Joe',
            lastName: 'Bloggs',
            dateOfBirth: '1970-01-01',
            appointments: [
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      await videoLinkService.requestVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.requestVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
    })

    it('Posts a request to create a court hearing booking with a pre/post meeting', async () => {
      const journey = {
        type: 'COURT',
        prisoner: {
          prisonId: 'MDI',
          prisonName: 'Moorland',
          firstName: 'Joe',
          lastName: 'Bloggs',
          dateOfBirth: '1970-01-01',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        preLocationCode: 'PRE_LOCATION',
        preHearingStartTime: '1970-01-01T13:15:00Z',
        preHearingEndTime: '1970-01-01T13:30:00Z',
        postLocationCode: 'POST_LOCATION',
        postHearingStartTime: '1970-01-01T14:30:00Z',
        postHearingEndTime: '1970-01-01T14:45:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            firstName: 'Joe',
            lastName: 'Bloggs',
            dateOfBirth: '1970-01-01',
            appointments: [
              {
                type: 'VLB_COURT_PRE',
                locationKey: 'PRE_LOCATION',
                date: '2022-03-20',
                startTime: '13:15',
                endTime: '13:30',
              },
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
              {
                type: 'VLB_COURT_POST',
                locationKey: 'POST_LOCATION',
                date: '2022-03-20',
                startTime: '14:30',
                endTime: '14:45',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      await videoLinkService.requestVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.requestVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
    })
  })

  describe('amendVideoLinkBooking', () => {
    it('Posts a request to amend a probation meeting booking', async () => {
      const journey = {
        bookingId: 1,
        type: 'PROBATION',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'PROBATION_TEAM',
        hearingTypeCode: 'PSR',
        comments: 'comments',
      } as BookAVideoLinkJourney

      const expectedBody = {
        bookingType: 'PROBATION',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_PROBATION',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        probationTeamCode: 'PROBATION_TEAM',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      await videoLinkService.amendVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody, user)
    })

    it('Posts a request to amend a court hearing booking only', async () => {
      const journey = {
        bookingId: 1,
        type: 'COURT',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      } as BookAVideoLinkJourney

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      await videoLinkService.amendVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody, user)
    })

    it('Posts a request to amend a court hearing booking with a pre/post meeting', async () => {
      const journey = {
        bookingId: 1,
        type: 'COURT',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        preLocationCode: 'PRE_LOCATION',
        preHearingStartTime: '1970-01-01T13:15:00Z',
        preHearingEndTime: '1970-01-01T13:30:00Z',
        postLocationCode: 'POST_LOCATION',
        postHearingStartTime: '1970-01-01T14:30:00Z',
        postHearingEndTime: '1970-01-01T14:45:00Z',
        agencyCode: 'COURT_HOUSE',
        hearingTypeCode: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      } as BookAVideoLinkJourney

      const expectedBody = {
        bookingType: 'COURT',
        prisoners: [
          {
            prisonCode: 'MDI',
            prisonerNumber: 'ABC123',
            appointments: [
              {
                type: 'VLB_COURT_PRE',
                locationKey: 'PRE_LOCATION',
                date: '2022-03-20',
                startTime: '13:15',
                endTime: '13:30',
              },
              {
                type: 'VLB_COURT_MAIN',
                locationKey: 'LOCATION',
                date: '2022-03-20',
                startTime: '13:30',
                endTime: '14:30',
              },
              {
                type: 'VLB_COURT_POST',
                locationKey: 'POST_LOCATION',
                date: '2022-03-20',
                startTime: '14:30',
                endTime: '14:45',
              },
            ],
          },
        ],
        courtCode: 'COURT_HOUSE',
        courtHearingType: 'APPEAL',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

      await videoLinkService.amendVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody, user)
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
})
