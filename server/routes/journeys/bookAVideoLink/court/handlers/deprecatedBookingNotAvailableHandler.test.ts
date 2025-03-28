import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { AvailabilityResponse } from '../../../../../@types/bookAVideoLinkApi/types'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/courtBookingService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtBookingService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookACourtHearing: {
      preLocationCode: 'LOCATION_CODE',
      postLocationCode: 'LOCATION_CODE',
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check Booking handler', () => {
  beforeEach(() => {
    courtBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)
  })

  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
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
      courtBookingService.checkAvailability.mockResolvedValue({ availabilityOk: true } as AvailabilityResponse)

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .expect(302)
        .expect('location', 'check-booking')
    })
  })

  describe('POST', () => {
    const validForm = {
      startTime: '13:00',
      endTime: '14:00',
      preStart: '12:45',
      preEnd: '13:00',
      postStart: '14:00',
      postEnd: '14:15',
    }

    it('should validate no fields posted', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
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
            {
              fieldId: 'preStart',
              href: '#preStart',
              text: 'A pre-court start time must be present',
            },
            {
              fieldId: 'preEnd',
              href: '#preEnd',
              text: 'A pre-court end time must be present',
            },
            {
              fieldId: 'postStart',
              href: '#postStart',
              text: 'A post-court start time must be present',
            },
            {
              fieldId: 'postEnd',
              href: '#postEnd',
              text: 'A post-court end time must be present',
            },
          ])
        })
    })

    it('should validate invalid fields posted', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .send({
          startTime: 'invalid',
          endTime: 'invalid',
          preStart: 'invalid',
          preEnd: 'invalid',
          postStart: 'invalid',
          postEnd: 'invalid',
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
            {
              fieldId: 'preStart',
              href: '#preStart',
              text: 'A valid pre-court start time must be present',
            },
            {
              fieldId: 'preEnd',
              href: '#preEnd',
              text: 'A valid pre-court end time must be present',
            },
            {
              fieldId: 'postStart',
              href: '#postStart',
              text: 'A valid post-court start time must be present',
            },
            {
              fieldId: 'postEnd',
              href: '#postEnd',
              text: 'A valid post-court end time must be present',
            },
          ])
        })
    })

    it('should validate empty pre and post times are accepted', () => {
      appSetup({ bookACourtHearing: {} })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .send({ ...validForm, preStart: undefined, preEnd: undefined, postStart: undefined, postEnd: undefined })
        .expect(() => expectNoErrorMessages())
    })

    it('should save the posted fields', async () => {
      courtBookingService.createVideoLinkBooking.mockResolvedValue(1)

      await request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
        .send(validForm)
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            endTime: '1970-01-01T14:00:00.000Z',
            postHearingEndTime: '1970-01-01T14:15:00.000Z',
            postHearingStartTime: '1970-01-01T14:00:00.000Z',
            postLocationCode: 'LOCATION_CODE',
            preHearingEndTime: '1970-01-01T13:00:00.000Z',
            preHearingStartTime: '1970-01-01T12:45:00.000Z',
            preLocationCode: 'LOCATION_CODE',
            startTime: '1970-01-01T13:00:00.000Z',
          }),
        )
    })
  })
})
