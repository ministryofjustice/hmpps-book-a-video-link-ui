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
                type: 'VLB_COURT_PROBATION',
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
})
