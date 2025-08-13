import type { Express } from 'express'
import request from 'supertest'
import { load } from 'cheerio'
import PrisonService from '../../../../services/prisonService'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { aDecoratedLocation, anUndecoratedLocation, aPrison } from '../../../testutils/adminTestUtils'
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

describe('View prisons handler', () => {
  describe('GET', () => {
    it(`should render all prisons`, () => {
      prisonService.getPrisons.mockResolvedValue([aPrison(), aPrison(2, 'RSI', 'Risley')])
      prisonService.getAppointmentLocations.mockResolvedValue([aDecoratedLocation('1')])

      return request(app)
        .get(`/admin/view-prison-list`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage a prison's video link rooms`)

          expect(prisonService.getPrisons).toHaveBeenCalledWith(true, user)
          expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith(aPrison().code, true, user)
          expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('RSI', true, user)

          expect(existsByDataQa($, `prison-HEI`)).toBeTruthy()
          expect(existsByDataQa($, `prison-RSI`)).toBeTruthy()
        })
    })

    it(`should render prison with no new rooms`, () => {
      prisonService.getAppointmentLocations.mockResolvedValue([aDecoratedLocation('1')])

      return request(app)
        .get(`/admin/view-prison-list`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage a prison's video link rooms`)

          expect(prisonService.getPrisons).toHaveBeenCalledWith(true, user)
          expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith(aPrison().code, true, user)

          expect(existsByDataQa($, `prison-HEI`)).toBeTruthy()

          const newRooms = getByDataQa($, `newRooms-${aPrison().code}`).text().trim()
          expect(newRooms).toBe('0')
        })
    })

    it(`should render prison with 1 new room`, () => {
      prisonService.getAppointmentLocations.mockResolvedValue([aDecoratedLocation('1'), anUndecoratedLocation('2')])

      return request(app)
        .get(`/admin/view-prison-list`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage a prison's video link rooms`)

          expect(existsByDataQa($, `prison-HEI`)).toBeTruthy()

          expect(prisonService.getPrisons).toHaveBeenCalledWith(true, user)
          expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith(aPrison().code, true, user)

          const newRooms = getByDataQa($, `newRooms-${aPrison().code}`).text().trim()
          expect(newRooms).toBe('1')
        })
    })

    it(`should render prison with 4 new rooms`, () => {
      prisonService.getAppointmentLocations.mockResolvedValue([
        aDecoratedLocation('1'),
        aDecoratedLocation('2'),
        anUndecoratedLocation('3'),
        anUndecoratedLocation('4'),
        anUndecoratedLocation('5'),
        anUndecoratedLocation('6'),
      ])

      return request(app)
        .get(`/admin/view-prison-list`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)

          const heading = $('h1').text().trim()
          expect(heading).toBe(`Manage a prison's video link rooms`)

          expect(existsByDataQa($, `prison-HEI`)).toBeTruthy()

          expect(prisonService.getPrisons).toHaveBeenCalledWith(true, user)
          expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith(aPrison().code, true, user)

          const newRooms = getByDataQa($, `newRooms-${aPrison().code}`).text().trim()
          expect(newRooms).toBe('4')
        })
    })
  })
})
