import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render index page', () => {
    return request(app)
      .get('/admin')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = $('h1').text().trim()

        expect(heading).toContain('Administration')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADMIN_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })

  it('Non-admin user should see a not found error', () => {
    app = appWithAllRoutes({
      services: { auditService },
      userSupplier: () => ({ ...user, isAdminUser: false }),
    })

    return request(app)
      .get('/admin')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
