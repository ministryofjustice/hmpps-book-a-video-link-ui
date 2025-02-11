import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'

jest.mock('../../../../../services/auditService')

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
    prisonerSearch: {},
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct page', () => {
    return request(app)
      .get(`/court/prisoner-search/${journeyId()}/prisoner-not-listed`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_NOT_LISTED_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(heading).toEqual('You can request a video link booking for a prisoner')
      })
  })
})
