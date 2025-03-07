import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import PrisonService from '../../../../../services/prisonService'
import PrisonerService from '../../../../../services/prisonerService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerService')
jest.mock('../../../../../services/prisonService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, prisonerService, prisonService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({ prisonerSearch: { firstName: 'John', lastName: 'Doe' } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner search results handler', () => {
  describe('GET', () => {
    it('should search for prisoners matching the criteria and render the correct view page', async () => {
      await request(app)
        .get(`/court/prisoner-search/${journeyId()}/results`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toContain('Search for a prisoner results')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_SEARCH_RESULTS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })

      expect(prisonerService.searchPrisonersByCriteria).toHaveBeenCalledWith(
        { firstName: 'John', lastName: 'Doe' },
        { page: 0, size: 10 },
        user,
      )
      expect(prisonService.getPrisons).toHaveBeenCalledWith(true, user)
    })

    it('should search using the correct pagination', async () => {
      await request(app)
        .get(`/court/prisoner-search/${journeyId()}/results?page=5`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toContain('Search for a prisoner results')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_SEARCH_RESULTS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })

      expect(prisonerService.searchPrisonersByCriteria).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 5, size: 10 },
        user,
      )
    })

    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s journey - should return home if there is no journey in session', (_: string, journey: string) => {
      appSetup()

      return request(app).get(`/${journey}/prisoner-search/${journeyId()}/results`).expect(302).expect('location', '/')
    })
  })
})
