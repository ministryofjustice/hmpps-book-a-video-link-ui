import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import config from '../../../../config'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService },
    userSupplier: () => user,
  })

  config.maintenance.enabled = false
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = $('h1').text().trim()

        expect(heading).toContain('Book a video link with a prison')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.HOME_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })

  it('user should see a scheduled maintenance screen', () => {
    config.maintenance.enabled = true
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = $('h1').text().trim()

        expect(heading).toContain('Sorry, scheduled maintenance affects this service')
      })
  })

  it('court user should be redirected to select court preferences if they have not selected any', () => {
    courtsService.getUserPreferences.mockResolvedValue([])

    app = appWithAllRoutes({
      services: { courtsService },
      userSupplier: () => ({
        ...user,
        isCourtUser: true,
        isProbationUser: false,
      }),
    })

    return request(app).get('/').expect(302).expect('location', '/court/user-preferences')
  })

  it('probation user should be redirected to select court preferences if they have not selected any', () => {
    probationTeamsService.getUserPreferences.mockResolvedValue([])

    app = appWithAllRoutes({
      services: { probationTeamsService },
      userSupplier: () => ({
        ...user,
        isCourtUser: false,
        isProbationUser: true,
      }),
    })

    return request(app).get('/').expect(302).expect('location', '/probation/user-preferences')
  })
})
