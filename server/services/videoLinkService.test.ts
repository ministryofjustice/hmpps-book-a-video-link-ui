import sinon from 'sinon'
import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import VideoLinkService from './videoLinkService'
import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'

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
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue([{ code: 'code', description: 'description' }])
      const result = await videoLinkService.getCourtHearingTypes(user)
      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('COURT_HEARING_TYPE', user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })

  describe('getProbationMeetingTypes', () => {
    it('Retrieves probation meeting types', async () => {
      bookAVideoLinkClient.getReferenceCodesForGroup.mockResolvedValue([{ code: 'code', description: 'description' }])
      const result = await videoLinkService.getProbationMeetingTypes(user)
      expect(bookAVideoLinkClient.getReferenceCodesForGroup).toHaveBeenCalledWith('PROBATION_MEETING_TYPE', user)
      expect(result).toEqual([{ code: 'code', description: 'description' }])
    })
  })

  describe('getVideoLinkBookingById', () => {
    it('Retrieves a video link booking by ID', async () => {
      bookAVideoLinkClient.getVideoLinkBookingById.mockResolvedValue({ data: 'data' })
      const result = await videoLinkService.getVideoLinkBookingById(1, user)
      expect(bookAVideoLinkClient.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(result).toEqual({ data: 'data' })
    })
  })

  describe('checkAvailability', () => {
    const commonJourney = {
      type: 'COURT',
      prisoner: {
        prisonId: 'MDI',
        prisonerNumber: 'ABC123',
        prisonName: 'Moorland',
        name: 'Joe Bloggs',
      },
      date: '2022-03-20T00:00:00Z',
      locationCode: 'LOCATION_CODE',
      startTime: '1970-01-01T13:30:00Z',
      endTime: '1970-01-01T14:30:00Z',
      agencyCode: 'AGENCY_CODE',
    }

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
          name: 'Joe Bloggs',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'PROBATION_TEAM',
        hearingTypeCode: 'PSR',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

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
        videoLinkUrl: 'videoLinkUrl',
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
          name: 'Joe Bloggs',
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
          name: 'Joe Bloggs',
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

  describe('amendVideoLinkBooking', () => {
    it('Posts a request to amend a probation meeting booking', async () => {
      const journey = {
        bookingId: 1,
        type: 'PROBATION',
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
          name: 'Joe Bloggs',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        agencyCode: 'PROBATION_TEAM',
        hearingTypeCode: 'PSR',
        comments: 'comments',
        videoLinkUrl: 'videoLinkUrl',
      }

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
        videoLinkUrl: 'videoLinkUrl',
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
          name: 'Joe Bloggs',
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
          name: 'Joe Bloggs',
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

  describe('getVideoLinkSchedule', () => {
    const date = new Date('2022-03-20T00:00:00Z')
    const agencyCode = 'AGENCY_CODE'

    it('Retrieves and maps video link schedule for court agency', async () => {
      const appointments = [
        {
          bookingId: 1,
          prisonCode: 'MDI',
          prisonerNumber: 'ABC123',
          prisonLocKey: 'LOCATION1',
          startTime: '1970-01-01T13:30:00Z',
          endTime: '1970-01-01T14:30:00Z',
        },
        {
          bookingId: 2,
          prisonCode: 'MDI',
          prisonerNumber: 'DEF456',
          prisonLocKey: 'LOCATION2',
          startTime: '1970-01-01T14:30:00Z',
          endTime: '1970-01-01T15:30:00Z',
        },
      ]

      const locations = [
        { key: 'LOCATION1', description: 'Location 1 Description' },
        { key: 'LOCATION2', description: 'Location 2 Description' },
      ]

      const prisoners = [
        { prisonerNumber: 'ABC123', firstName: 'John', lastName: 'Doe' },
        { prisonerNumber: 'DEF456', firstName: 'Jane', lastName: 'Smith' },
      ]

      bookAVideoLinkClient.getVideoLinkSchedule.mockResolvedValue(appointments)
      bookAVideoLinkClient.getAppointmentLocations.mockResolvedValue(locations)
      prisonerOffenderSearchClient.getByPrisonerNumbers.mockResolvedValue(prisoners)

      const result = await videoLinkService.getVideoLinkSchedule('court', agencyCode, date, user)

      expect(bookAVideoLinkClient.getVideoLinkSchedule).toHaveBeenCalledWith('court', agencyCode, date, user)
      expect(bookAVideoLinkClient.getAppointmentLocations).toHaveBeenCalledWith('MDI', user)
      expect(prisonerOffenderSearchClient.getByPrisonerNumbers).toHaveBeenCalledWith(['ABC123', 'DEF456'], user)
      expect(result).toEqual([
        {
          ...appointments[0],
          prisonerName: 'John Doe',
          prisonLocationDescription: 'Location 1 Description',
        },
        {
          ...appointments[1],
          prisonerName: 'Jane Smith',
          prisonLocationDescription: 'Location 2 Description',
        },
      ])
    })

    it('Retrieves and maps video link schedule for probation agency', async () => {
      const appointments = [
        {
          bookingId: 1,
          prisonCode: 'MDI',
          prisonerNumber: 'ABC123',
          prisonLocKey: 'LOCATION1',
          startTime: '1970-01-01T13:30:00Z',
          endTime: '1970-01-01T14:30:00Z',
        },
      ]

      const locations = [{ key: 'LOCATION1', description: 'Location 1 Description' }]

      const prisoners = [{ prisonerNumber: 'ABC123', firstName: 'John', lastName: 'Doe' }]

      bookAVideoLinkClient.getVideoLinkSchedule.mockResolvedValue(appointments)
      bookAVideoLinkClient.getAppointmentLocations.mockResolvedValue(locations)
      prisonerOffenderSearchClient.getByPrisonerNumbers.mockResolvedValue(prisoners)

      const result = await videoLinkService.getVideoLinkSchedule('probation', agencyCode, date, user)

      expect(bookAVideoLinkClient.getVideoLinkSchedule).toHaveBeenCalledWith('probation', agencyCode, date, user)
      expect(bookAVideoLinkClient.getAppointmentLocations).toHaveBeenCalledWith('MDI', user)
      expect(prisonerOffenderSearchClient.getByPrisonerNumbers).toHaveBeenCalledWith(['ABC123'], user)
      expect(result).toEqual([
        {
          ...appointments[0],
          prisonerName: 'John Doe',
          prisonLocationDescription: 'Location 1 Description',
        },
      ])
    })

    it('Handles empty schedule gracefully', async () => {
      bookAVideoLinkClient.getVideoLinkSchedule.mockResolvedValue([])

      const result = await videoLinkService.getVideoLinkSchedule('court', agencyCode, date, user)

      expect(result).toEqual([])
      expect(bookAVideoLinkClient.getVideoLinkSchedule).toHaveBeenCalledWith('court', agencyCode, date, user)
    })
  })
})
