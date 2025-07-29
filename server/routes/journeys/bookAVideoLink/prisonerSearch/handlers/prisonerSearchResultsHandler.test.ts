import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import PrisonService from '../../../../../services/prisonService'
import PrisonerService from '../../../../../services/prisonerService'
import config from '../../../../../config'
import { PagePrisoner, Prisoner } from '../../../../../@types/prisonerOffenderSearchApi/types'

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

    it('should not offer booking links for grey release prisons in config', async () => {
      config.featureToggles.greyReleasePrisons = 'BXI,BMI'

      // Two enabled prisons
      prisonService.getPrisons.mockResolvedValue([
        {
          prisonId: 1,
          code: 'HEI',
          name: 'Hewell',
          enabled: true,
        },
        {
          prisonId: 2,
          code: 'BXI',
          name: 'Brixton',
          enabled: true,
        },
      ])

      // One prisoner in each prison
      prisonerService.searchPrisonersByCriteria.mockResolvedValue({
        totalPages: 1,
        totalElements: 2,
        numberOfElements: 2,
        first: true,
        last: true,
        empty: false,
        size: 10,
        content: [
          {
            prisonerNumber: 'A1111AA',
            firstName: 'AAAA',
            lastName: 'AAAA',
            dateOfBirth: '2011-01-01',
            gender: 'M',
            status: 'ACTIVE IN',
            prisonId: 'HEI',
          } as unknown as Prisoner,
          {
            prisonerNumber: 'B2222BB',
            firstName: 'BBBB',
            lastName: 'BBBB',
            dateOfBirth: '2011-01-01',
            gender: 'M',
            status: 'ACTIVE IN',
            prisonId: 'BXI',
          } as unknown as Prisoner,
        ],
      } as unknown as Promise<PagePrisoner>)

      await request(app)
        .get(`/court/prisoner-search/${journeyId()}/results`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toContain('Search for a prisoner results')

          // One of the rows should have hidden text where the book a video link is not shown
          const rowWithNoLink = $('span.govuk-visually-hidden').text()
          expect(rowWithNoLink).toContain('Prison not enabled for book a video link')
        })

      expect(prisonerService.searchPrisonersByCriteria).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 0, size: 10 },
        user,
      )
    })

    it('should not offer booking links for courts into probation-only prisons in config', async () => {
      config.featureToggles.probationOnlyPrisons = 'BXI,BMI'

      // Two enabled prisons
      prisonService.getPrisons.mockResolvedValue([
        {
          prisonId: 1,
          code: 'HEI',
          name: 'Hewell',
          enabled: true,
        },
        {
          prisonId: 2,
          code: 'BXI',
          name: 'Brixton',
          enabled: true,
        },
      ])

      // One prisoner in each prison
      prisonerService.searchPrisonersByCriteria.mockResolvedValue({
        totalPages: 1,
        totalElements: 2,
        numberOfElements: 2,
        first: true,
        last: true,
        empty: false,
        size: 10,
        content: [
          {
            prisonerNumber: 'A1111AA',
            firstName: 'AAAA',
            lastName: 'AAAA',
            dateOfBirth: '2011-01-01',
            gender: 'M',
            status: 'ACTIVE IN',
            prisonId: 'HEI',
          } as unknown as Prisoner,
          {
            prisonerNumber: 'B2222BB',
            firstName: 'BBBB',
            lastName: 'BBBB',
            dateOfBirth: '2011-01-01',
            gender: 'M',
            status: 'ACTIVE IN',
            prisonId: 'BXI',
          } as unknown as Prisoner,
        ],
      } as unknown as Promise<PagePrisoner>)

      await request(app)
        .get(`/court/prisoner-search/${journeyId()}/results`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toContain('Search for a prisoner results')

          // One of the rows should have hidden text where the book a video link is not shown
          const rowWithNoLink = $('span.govuk-visually-hidden').text()
          expect(rowWithNoLink).toContain('Prison not enabled for book a video link')
        })

      expect(prisonerService.searchPrisonersByCriteria).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 0, size: 10 },
        user,
      )
    })

    it('should not offer booking links for probation into court-only prisons in config', async () => {
      config.featureToggles.courtOnlyPrisons = 'BXI,BMI'

      // Two enabled prisons
      prisonService.getPrisons.mockResolvedValue([
        {
          prisonId: 1,
          code: 'HEI',
          name: 'Hewell',
          enabled: true,
        },
        {
          prisonId: 2,
          code: 'BXI',
          name: 'Brixton',
          enabled: true,
        },
      ])

      // One prisoner in each prison
      prisonerService.searchPrisonersByCriteria.mockResolvedValue({
        totalPages: 1,
        totalElements: 2,
        numberOfElements: 2,
        first: true,
        last: true,
        empty: false,
        size: 10,
        content: [
          {
            prisonerNumber: 'A1111AA',
            firstName: 'AAAA',
            lastName: 'AAAA',
            dateOfBirth: '2011-01-01',
            gender: 'M',
            status: 'ACTIVE IN',
            prisonId: 'HEI',
          } as unknown as Prisoner,
          {
            prisonerNumber: 'B2222BB',
            firstName: 'BBBB',
            lastName: 'BBBB',
            dateOfBirth: '2011-01-01',
            gender: 'M',
            status: 'ACTIVE IN',
            prisonId: 'BXI',
          } as unknown as Prisoner,
        ],
      } as unknown as Promise<PagePrisoner>)

      await request(app)
        .get(`/probation/prisoner-search/${journeyId()}/results`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toContain('Search for a prisoner results')

          // One of the rows should have hidden text where the book a video link is not shown
          const rowWithNoLink = $('span.govuk-visually-hidden').text()
          expect(rowWithNoLink).toContain('Prison not enabled for book a video link')
        })

      expect(prisonerService.searchPrisonersByCriteria).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 0, size: 10 },
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
