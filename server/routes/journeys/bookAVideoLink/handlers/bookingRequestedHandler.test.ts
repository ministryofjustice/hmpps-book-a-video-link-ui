import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import expectJourneySession from '../../../testutils/testUtilRoute'

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookAVideoLink: {
      prisoner: { prisonId: 'MDI' },
      date: '2024-06-12',
      startTime: '1970-01-01T16:00',
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct view page', () => {
    return request(app)
      .get(`/court/booking/request/${journeyId()}/prisoner/video-link-booking/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_REQUESTED_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('The video link has been requested')
        expect(bookAnotherLink).toEqual(`/court/booking/create/prisoner-search`)
      })
      .then(() => expectJourneySession(app, 'bookAVideoLink', null))
  })
})
