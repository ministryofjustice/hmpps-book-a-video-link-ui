import { AuditService } from '@ministryofjustice/hmpps-audit-client'
import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import Page from '../../../../enumerator/page'
import { getByDataQa, getPageHeader } from '../../../../testutils/cheerio'
import expectJourneySession from '../../../../testutils/testUtilRoute'

jest.mock('@ministryofjustice/hmpps-audit-client')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => appSetup())

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct view page', () => {
    return request(app)
      .get(`/probation/booking/request/${journeyId()}/prisoner/video-link-booking/confirmation`)
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
        expect(bookAnotherLink).toEqual(`/probation/prisoner-search/search`)
      })
      .then(() => expectJourneySession(app, 'bookAProbationMeeting', null))
  })
})
