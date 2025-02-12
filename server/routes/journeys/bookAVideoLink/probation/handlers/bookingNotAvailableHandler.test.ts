import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { AvailabilityResponse } from '../../../../../@types/bookAVideoLinkApi/types'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/probationBookingService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, probationBookingService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookAVideoLink: {},
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check Booking handler', () => {
  beforeEach(() => {
    probationBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)
  })

  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Video link booking not available')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_NOT_AVAILABLE_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })

    it('should redirect to check booking page if availability is ok', () => {
      probationBookingService.checkAvailability.mockResolvedValue({ availabilityOk: true } as AvailabilityResponse)

      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .expect(302)
        .expect('location', 'check-booking')
    })
  })

  describe('POST', () => {
    const validForm = {
      startTime: '13:00',
      endTime: '14:00',
    }

    it('should validate no fields posted', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'startTime',
              href: '#startTime',
              text: 'A start time must be present',
            },
            {
              fieldId: 'endTime',
              href: '#endTime',
              text: 'A end time must be present',
            },
          ])
        })
    })

    it('should validate invalid fields posted', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .send({
          startTime: 'invalid',
          endTime: 'invalid',
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'startTime',
              href: '#startTime',
              text: 'A valid start time must be present',
            },
            {
              fieldId: 'endTime',
              href: '#endTime',
              text: 'A valid end time must be present',
            },
          ])
        })
    })

    it('should save the posted fields', async () => {
      probationBookingService.createVideoLinkBooking.mockResolvedValue(1)

      await request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .send(validForm)
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookAVideoLink', {
            startTime: '1970-01-01T13:00:00.000Z',
            endTime: '1970-01-01T14:00:00.000Z',
          }),
        )
    })
  })
})
