import request from 'supertest'
import * as cheerio from 'cheerio'
import { Express } from 'express'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import PrisonService from '../../../../services/prisonService'

const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { prisonService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Extract prison room config handler', () => {
  describe('GET', () => {
    it('should show content', () => {
      return request(app)
        .get(`/admin/extract-prison-room-configuration`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('h1').text().trim()

          expect(heading).toBe(`Extract data for room configuration`)
        })
    })
  })
})
