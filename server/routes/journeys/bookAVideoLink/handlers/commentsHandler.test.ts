import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { existsByDataQa, getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
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
      bookingId: 1001,
      comments: 'Test comment',
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Comments handler', () => {
  describe('GET', () => {
    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s journey - should render the correct view page', (_: string, journey: string) => {
      return request(app)
        .get(`/booking/${journey}/edit/1001/${journeyId()}/add-video-link-booking/comments`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const cancelLink = getByDataQa($, 'cancel-link').attr('href')

          expect(heading).toEqual('Change comments on this booking')
          expect(cancelLink).toEqual(`/${journey}/view-booking/1001`)
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.COMMENTS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })
})
