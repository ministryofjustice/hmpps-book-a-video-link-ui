import type { Express } from 'express'
import request from 'supertest'
import { load } from 'cheerio'
import PrisonService from '../../../../services/prisonService'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { aPrison } from '../../../testutils/adminTestUtils'
import { existsByDataQa, getByDataQa } from '../../../testutils/cheerio'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { prisonService },
    userSupplier: () => user,
  })

  prisonService.getPrisons.mockResolvedValue([aPrison()])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('View prison pick-up times handler', () => {
  describe('GET', () => {
    it(`should render pick-up time enabled prison`, () => {
      prisonService.getPrisons.mockResolvedValue([aPrison()])

      return request(app)
        .get(`/admin/view-prison-details`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage prison details`)

          expect(prisonService.getPrisons).toHaveBeenCalledWith(false, user)

          expect(getByDataQa($, 'prison-enabled-HEI').text().trim()).toBe('Yes')
          expect(getByDataQa($, 'prison-time-HEI').text().trim()).toBe('--')
          expect(existsByDataQa($, `prison-code-HEI`)).toBeTruthy()
        })
    })

    it(`should render pick-up time disabled prison`, () => {
      prisonService.getPrisons.mockResolvedValue([aPrison(2, 'RSI', 'Risley', false)])

      return request(app)
        .get(`/admin/view-prison-details`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage prison details`)

          expect(prisonService.getPrisons).toHaveBeenCalledWith(false, user)

          expect(getByDataQa($, 'prison-enabled-RSI').text().trim()).toBe('No')
          expect(getByDataQa($, 'prison-time-RSI').text().trim()).toBe('--')
          expect(existsByDataQa($, `prison-code-RSI`)).toBeTruthy()
        })
    })

    it(`should render enabled and disabled pick-up time disabled prisons`, () => {
      prisonService.getPrisons.mockResolvedValue([aPrison(), aPrison(2, 'RSI', 'Risley', false, 30)])

      return request(app)
        .get(`/admin/view-prison-details`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage prison details`)

          expect(prisonService.getPrisons).toHaveBeenCalledWith(false, user)

          expect(getByDataQa($, 'prison-enabled-HEI').text().trim()).toBe('Yes')
          expect(getByDataQa($, 'prison-time-HEI').text().trim()).toBe('--')
          expect(existsByDataQa($, `prison-code-HEI`)).toBeTruthy()

          expect(getByDataQa($, 'prison-enabled-RSI').text().trim()).toBe('No')
          expect(getByDataQa($, 'prison-time-RSI').text().trim()).toBe('30 min')
          expect(existsByDataQa($, `prison-code-RSI`)).toBeTruthy()
        })
    })
  })
})
