import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfTomorrow } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { AvailableLocationsResponse } from '../../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../../config'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/probationBookingService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>

let app: Express

const appSetup = (journeySession = {}) => {
  config.featureToggles.enhancedProbationJourneyEnabled = true

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
      },
      {
        name: 'Video room 2',
        startTime: '11:00',
        endTime: '13:00',
        dpsLocationKey: 'VIDEO_2',
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

          expect(heading).toEqual('Available bookings')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_AVAILABILITY_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(probationBookingService.getAvailableLocations).toHaveBeenCalled()
        })
    })
  })

  describe('POST', () => {
    const validForm = {
      option: '11:00///12:00///VIDEO_2',
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
            startTime: '1970-01-01T11:00:00.000Z',
            endTime: '1970-01-01T12:00:00.000Z',
            locationCode: 'VIDEO_2',
          }),
        )
    })
  })
})
