import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import VideoLinkService from '../../../../../services/videoLinkService'
import expectJourneySession from '../../../../testutils/testUtilRoute'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookACourtHearing: {
      bookingId: 1,
      prisoner: { prisonId: 'MDI', firstName: 'John', lastName: 'Smith' },
      date: '2024-06-12',
      startTime: '1970-01-01T16:00',
    },
  })

  videoLinkService.bookingIsAmendable.mockReturnValue(true)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Confirm Cancel handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/cancel/1/${journeyId()}/confirm`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Are you sure you want to cancel John Smith's booking?")
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONFIRM_CANCEL_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })

    it('should redirect to view the booking if the booking is not cancellable', () => {
      videoLinkService.bookingIsAmendable.mockReturnValue(false)

      return request(app)
        .get(`/court/booking/cancel/1/${journeyId()}/confirm`)
        .expect(302)
        .expect('location', '/court/view-booking/1')
        .then(() => expectJourneySession(app, 'bookACourtHearing', null))
    })
  })

  describe('POST', () => {
    it('should cancel the booking', () => {
      return request(app)
        .post(`/court/booking/cancel/1/${journeyId()}/confirm`)
        .send({})
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(videoLinkService.cancelVideoLinkBooking).toHaveBeenCalledWith(1, user)
        })
    })
  })
})
