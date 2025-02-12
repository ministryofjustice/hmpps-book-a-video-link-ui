import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import { BookAVideoLinkJourney } from '../routes/journeys/bookAVideoLink/journey'
import CourtBookingService from './courtBookingService'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Court booking service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let courtBookingService: CourtBookingService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    courtBookingService = new CourtBookingService(bookAVideoLinkClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
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

      await courtBookingService.checkAvailability(journey, user)

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

      await courtBookingService.checkAvailability(journey, user)

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

      await courtBookingService.checkAvailability(journey, user)

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

      await courtBookingService.checkAvailability(journey, user)

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

      const result = await courtBookingService.createVideoLinkBooking(journey, user)

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

      const result = await courtBookingService.createVideoLinkBooking(journey, user)

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

      const result = await courtBookingService.createVideoLinkBooking(journey, user)

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

      await courtBookingService.requestVideoLinkBooking(journey, user)

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

      await courtBookingService.requestVideoLinkBooking(journey, user)

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

      await courtBookingService.requestVideoLinkBooking(journey, user)

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

      await courtBookingService.amendVideoLinkBooking(journey, user)

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

      await courtBookingService.amendVideoLinkBooking(journey, user)

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

      await courtBookingService.amendVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody, user)
    })
  })
})
