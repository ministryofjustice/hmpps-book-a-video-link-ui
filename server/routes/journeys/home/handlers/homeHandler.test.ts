import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import config from '../../../../config'
import UserService from '../../../../services/userService'
import { Court, ProbationTeam } from '../../../../@types/bookAVideoLinkApi/types'
import populateUserPreferencesMiddleware from '../../../../middleware/populateUserPreferencesMiddleware'
import { Services } from '../../../../services'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/userService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const userService = new UserService(null, null) as jest.Mocked<UserService>
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

  it('court user has user preferences migrated from user-preferences-api', async () => {
    const testUser = {
      ...user,
      isCourtUser: true,
      isProbationUser: false,
    }

    courtsService.getUserPreferences.mockResolvedValueOnce([])
    userService.getUserPreferences.mockResolvedValue({ items: ['ABERCV'] })
    courtsService.getUserPreferences.mockResolvedValueOnce([{ code: 'ABERCV' } as Court])

    app = appWithAllRoutes({
      services: { courtsService, userService, auditService },
      userSupplier: () => testUser,
      middlewares: [populateUserPreferencesMiddleware({ courtsService, userService } as unknown as Services)],
    })

    await request(app)
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

    expect(courtsService.setUserPreferences).toBeCalledWith(['ABERCV'], testUser)
  })

  it('probation user has user preferences migrated from user-preferences-api', async () => {
    const testUser = {
      ...user,
      isCourtUser: false,
      isProbationUser: true,
    }

    probationTeamsService.getUserPreferences.mockResolvedValueOnce([])
    userService.getUserPreferences.mockResolvedValue({ items: ['BARNET'] })
    probationTeamsService.getUserPreferences.mockResolvedValueOnce([{ code: 'BARNET' } as ProbationTeam])

    app = appWithAllRoutes({
      services: { probationTeamsService, userService, auditService },
      userSupplier: () => testUser,
      middlewares: [populateUserPreferencesMiddleware({ probationTeamsService, userService } as unknown as Services)],
    })

    await request(app)
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

    expect(probationTeamsService.setUserPreferences).toBeCalledWith(['BARNET'], testUser)
  })

  it('court user should be redirected to select court preferences if they have not selected any', async () => {
    courtsService.getUserPreferences.mockResolvedValue([])
    userService.getUserPreferences.mockResolvedValue({ items: [] })

    app = appWithAllRoutes({
      services: { courtsService },
      userSupplier: () => ({
        ...user,
        isCourtUser: true,
        isProbationUser: false,
      }),
      middlewares: [populateUserPreferencesMiddleware({ courtsService, userService } as unknown as Services)],
    })

    await request(app).get('/').expect(302).expect('location', '/court/user-preferences')
    expect(courtsService.setUserPreferences).not.toHaveBeenCalled()
  })

  it('probation user should be redirected to select court preferences if they have not selected any', async () => {
    probationTeamsService.getUserPreferences.mockResolvedValue([])
    userService.getUserPreferences.mockResolvedValue({ items: [] })

    app = appWithAllRoutes({
      services: { probationTeamsService, userService },
      userSupplier: () => ({
        ...user,
        isCourtUser: false,
        isProbationUser: true,
      }),

      middlewares: [populateUserPreferencesMiddleware({ probationTeamsService, userService } as unknown as Services)],
    })

    await request(app).get('/').expect(302).expect('location', '/probation/user-preferences')
    expect(probationTeamsService.setUserPreferences).not.toHaveBeenCalled()
  })
})
