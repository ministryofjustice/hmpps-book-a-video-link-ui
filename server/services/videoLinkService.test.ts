import sinon from 'sinon'
import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import VideoLinkService from './videoLinkService'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Video link service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let videoLinkService: VideoLinkService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    videoLinkService = new VideoLinkService(bookAVideoLinkClient)
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
})
