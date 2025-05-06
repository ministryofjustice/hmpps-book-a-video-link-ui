import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfTomorrow } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getTextById, getPageHeader, radioOptions, getPageAlert } from '../../../../testutils/cheerio'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { AvailableLocationsResponse } from '../../../../../@types/bookAVideoLinkApi/types'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/probationBookingService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: {
      auditService,
      probationBookingService,
    },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

const bookAProbationMeetingSession = {
  probationTeamCode: 'CODE',
  date: startOfTomorrow().toISOString(),
  meetingTypeCode: 'PSR',
  prisoner: {
    firstName: 'Joe',
    lastName: 'Smith',
    dateOfBirth: '1970-01-01',
    prisonId: 'MDI',
    prisonName: 'Moorland',
    prisonerNumber: 'A1234AA',
  },
  officerDetailsNotKnown: false,
  officer: {
    fullName: 'John Bing',
    email: 'jbing@gmail.com',
    telephone: '07892 398108',
  },
  duration: 120,
  timePeriods: ['AM'],
}

beforeEach(() => {
  appSetup({ bookAProbationMeeting: bookAProbationMeetingSession })

  probationBookingService.getAvailableLocations.mockResolvedValue({
    locations: [
      {
        name: 'Video room 1',
        startTime: '10:00',
        endTime: '12:00',
        dpsLocationKey: 'VIDEO_1',
        timeSlot: 'AM',
      },
      {
        name: 'Video room 2',
        startTime: '11:00',
        endTime: '13:00',
        dpsLocationKey: 'VIDEO_2',
        timeSlot: 'AM',
      },
    ],
  } as AvailableLocationsResponse)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Booking availability handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/availability`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const radios = radioOptions($, 'option')
          const roomsAvailableText = getTextById($, 'probation-rooms-available')

          expect(heading).toEqual('Available bookings')
          expect(roomsAvailableText).toEqual(
            'Some rooms and times are allocated to court users only. The bookings shown below are the only times available for probation meetings.',
          )

          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_AVAILABILITY_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(probationBookingService.getAvailableLocations).toHaveBeenCalled()
          expect(radios).toEqual(['10:00///12:00///VIDEO_1///AM', '11:00///13:00///VIDEO_2///AM'])
        })
    })

    it('should offer alternative suggestions if the requested slot is not available', () => {
      probationBookingService.getAvailableLocations.mockResolvedValue({
        locations: [
          {
            name: 'Video room 1',
            startTime: '13:00',
            endTime: '14:00',
            dpsLocationKey: 'VIDEO_1',
            timeSlot: 'PM',
          },
          {
            name: 'Video room 2',
            startTime: '15:00',
            endTime: '16:00',
            dpsLocationKey: 'VIDEO_2',
            timeSlot: 'PM',
          },
        ],
      } as AvailableLocationsResponse)

      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/availability`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const radios = radioOptions($, 'option')
          const roomsAvailableText = getTextById($, 'probation-rooms-available')

          expect(heading).toEqual('No bookings available for your selected time periods')
          expect(probationBookingService.getAvailableLocations).toHaveBeenCalled()
          expect(radios).toEqual(['13:00///14:00///VIDEO_1///PM', '15:00///16:00///VIDEO_2///PM'])
          expect(roomsAvailableText).toEqual(
            'Some rooms and times are allocated to court users only. The bookings shown below are the only times available for probation meetings.',
          )
        })
    })

    it('should handle no available suggestions', () => {
      probationBookingService.getAvailableLocations.mockResolvedValue({
        locations: [],
      } as AvailableLocationsResponse)

      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/availability`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const noRoomsAvailablePageAlert = getPageAlert($)

          expect(heading).toEqual('No bookings available')
          expect(noRoomsAvailablePageAlert).toEqual(
            'There are no more bookings available for probation meetings on the date you selected. You will need to change the date.',
          )
          expect(probationBookingService.getAvailableLocations).toHaveBeenCalled()
        })
    })
  })

  describe('POST', () => {
    const validForm = {
      option: '15:00///16:00///VIDEO_2///PM',
    }

    it('should validate an empty form', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/availability`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'option',
              href: '#option',
              text: 'Select a suitable booking',
            },
          ])
        })
    })

    it('should save the posted fields in session', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/availability`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            ...bookAProbationMeetingSession,
            startTime: '1970-01-01T15:00:00.000Z',
            endTime: '1970-01-01T16:00:00.000Z',
            locationCode: 'VIDEO_2',
            timePeriods: ['PM'],
          }),
        )
    })
  })
})
