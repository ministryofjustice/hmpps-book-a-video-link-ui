import createUser from '../testutils/createUser'
import BookAVideoLinkApiClient from '../data/bookAVideoLinkApiClient'
import ProbationBookingService from './probationBookingService'
import { BookAProbationMeetingJourney } from '../routes/journeys/bookAVideoLink/probation/journey'

jest.mock('../data/bookAVideoLinkApiClient')

describe('Probation booking service', () => {
  let bookAVideoLinkClient: jest.Mocked<BookAVideoLinkApiClient>
  let probationBookingService: ProbationBookingService

  const user = createUser([])

  beforeEach(() => {
    bookAVideoLinkClient = new BookAVideoLinkApiClient() as jest.Mocked<BookAVideoLinkApiClient>
    probationBookingService = new ProbationBookingService(bookAVideoLinkClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('checkAvailability', () => {
    const commonJourney = {
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
      probationTeamCode: 'AGENCY_CODE',
    } as BookAProbationMeetingJourney

    it('should correctly handle the availability of a probation meeting', async () => {
      const journey = { ...commonJourney }

      await probationBookingService.checkAvailability(journey, user)

      expect(bookAVideoLinkClient.checkAvailability).toHaveBeenCalledWith(
        {
          bookingType: 'PROBATION',
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
  })

  describe('getAvailableLocations', () => {
    it('should correctly fetch the list of available locations', async () => {
      const journey = {
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
        probationTeamCode: 'AGENCY_CODE',
        duration: 120,
        timePeriods: ['AM'],
      } as BookAProbationMeetingJourney

      await probationBookingService.getAvailableLocations(journey, user)

      expect(bookAVideoLinkClient.fetchAvailableLocations).toHaveBeenCalledWith(
        {
          prisonCode: 'MDI',
          bookingType: 'PROBATION',
          probationTeamCode: 'AGENCY_CODE',
          date: '2022-03-20',
          bookingDuration: 120,
          timeSlots: ['AM'],
        },
        user,
      )
    })
  })

  describe('createVideoLinkBooking', () => {
    const journey = {
      prisoner: {
        prisonId: 'MDI',
        prisonerNumber: 'ABC123',
        prisonName: 'Moorland',
      },
      officer: {
        fullName: 'John Bing',
        email: 'jbing@gmail.com',
        telephone: '07892 398108',
      },
      duration: 120,
      timePeriods: ['AM'],
      date: '2022-03-20T00:00:00Z',
      locationCode: 'LOCATION',
      startTime: '1970-01-01T13:30:00Z',
      endTime: '1970-01-01T14:30:00Z',
      probationTeamCode: 'PROBATION_TEAM',
      meetingTypeCode: 'PSR',
      comments: 'comments',
    } as BookAProbationMeetingJourney

    it('Posts a request to create a probation meeting booking', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

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
        additionalBookingDetails: {
          contactEmail: 'jbing@gmail.com',
          contactName: 'John Bing',
          contactNumber: '07892 398108',
        },
        probationTeamCode: 'PROBATION_TEAM',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      const result = await probationBookingService.createVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })

    it('Posts a request to create a probation meeting booking without any additional details', async () => {
      bookAVideoLinkClient.createVideoLinkBooking.mockResolvedValue(1)

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

      const result = await probationBookingService.createVideoLinkBooking({ ...journey, officer: undefined }, user)

      expect(bookAVideoLinkClient.createVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
      expect(result).toEqual(1)
    })
  })

  describe('requestVideoLinkBooking', () => {
    it('Posts a request to create a probation meeting booking', async () => {
      const journey = {
        prisoner: {
          prisonId: 'MDI',
          prisonName: 'Moorland',
          firstName: 'Joe',
          lastName: 'Bloggs',
          dateOfBirth: '1970-01-01',
        },
        officer: {
          fullName: 'John Bing',
          email: 'jbing@gmail.com',
          telephone: '07892 398108',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        probationTeamCode: 'PROBATION_TEAM',
        meetingTypeCode: 'PSR',
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
        additionalBookingDetails: {
          contactEmail: 'jbing@gmail.com',
          contactName: 'John Bing',
          contactNumber: '07892 398108',
        },
        probationTeamCode: 'PROBATION_TEAM',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      await probationBookingService.requestVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.requestVideoLinkBooking).toHaveBeenCalledWith(expectedBody, user)
    })
  })

  describe('amendVideoLinkBooking', () => {
    it('Posts a request to amend a probation meeting booking', async () => {
      const journey = {
        bookingId: 1,
        prisoner: {
          prisonId: 'MDI',
          prisonerNumber: 'ABC123',
          prisonName: 'Moorland',
        },
        officer: {
          fullName: 'John Bing',
          email: 'jbing@gmail.com',
          telephone: '07892 398108',
        },
        date: '2022-03-20T00:00:00Z',
        locationCode: 'LOCATION',
        startTime: '1970-01-01T13:30:00Z',
        endTime: '1970-01-01T14:30:00Z',
        probationTeamCode: 'PROBATION_TEAM',
        meetingTypeCode: 'PSR',
        comments: 'comments',
      } as BookAProbationMeetingJourney

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
        additionalBookingDetails: {
          contactEmail: 'jbing@gmail.com',
          contactName: 'John Bing',
          contactNumber: '07892 398108',
        },
        probationTeamCode: 'PROBATION_TEAM',
        probationMeetingType: 'PSR',
        comments: 'comments',
      }

      await probationBookingService.amendVideoLinkBooking(journey, user)

      expect(bookAVideoLinkClient.amendVideoLinkBooking).toHaveBeenCalledWith(1, expectedBody, user)
    })
  })
})
