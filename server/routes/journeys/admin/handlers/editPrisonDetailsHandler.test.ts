import type { Express } from 'express'
import request from 'supertest'
import { load } from 'cheerio'
import PrisonService from '../../../../services/prisonService'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { aPrison } from '../../../testutils/adminTestUtils'
import AdminService from '../../../../services/adminService'
import { Prison } from '../../../../@types/bookAVideoLinkApi/types'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/adminService')

const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const adminService = new AdminService(null) as jest.Mocked<AdminService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { prisonService, adminService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Edit prison details handler', () => {
  const hewellPrison: Prison = aPrison(1, 'HEI', 'Hewell', true, 30)
  const risleyPrison: Prison = aPrison(2, 'RSI', 'Risley', true, 35)
  const moorlandPrison: Prison = aPrison(2, 'MDI', 'Moorland', true)

  describe('GET', () => {
    it(`should prepopulate the edit form correctly for Hewell with set 30 minute pick-up time`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(hewellPrison)

      return request(app)
        .get(`/admin/edit-prison-details/${hewellPrison.code}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)
          const heading = $('h1').text().trim()
          expect(heading).toBe('Hewell')

          const pickUpTimeOnOff = $("input[type='radio'][name='pickUpTimeOnOff']:checked").val()
          expect(pickUpTimeOnOff).toBe('on')

          const pickUpTimeChecked = $("input[type='radio'][name='pickUpTime']:checked").val()
          expect(pickUpTimeChecked).toBe('30')

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
        })
    })

    it(`should prepopulate the edit form correctly for Risley with custom pick-up time`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(risleyPrison)

      return request(app)
        .get(`/admin/edit-prison-details/${risleyPrison.code}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)
          const heading = $('h1').text().trim()
          expect(heading).toBe('Risley')

          const pickUpTimeOnOff = $("input[type='radio'][name='pickUpTimeOnOff']:checked").val()
          expect(pickUpTimeOnOff).toBe('on')

          const pickUpTimeChecked = $("input[type='radio'][name='pickUpTime']:checked").val()
          expect(pickUpTimeChecked).toBe('custom')

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('RSI', user)
        })
    })

    it(`should prepopulate the edit form correctly for Moorland with no pick-up time`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)

      return request(app)
        .get(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = load(res.text)
          const heading = $('h1').text().trim()
          expect(heading).toBe('Moorland')

          const pickUpTimeOnOff = $("input[type='radio'][name='pickUpTimeOnOff']:checked").val()
          expect(pickUpTimeOnOff).toBe('off')

          const pickUpTimeChecked = $("input[type='radio'][name='pickUpTime']:checked").val()
          expect(pickUpTimeChecked).toBeUndefined()

          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('MDI', user)
        })
    })
  })

  describe('POST', () => {
    it(`should post 15 minute pick-up time for Moorland`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: '15',
        })
        .expect(302)
        .expect('location', `/admin/edit-prison-details/MDI`)
        .expect(res => {
          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('MDI', user)
          expect(adminService.amendPrison).toHaveBeenCalledWith('MDI', { pickUpTime: 15 }, user)
        })
    })

    it(`should post 1 minute custom pick-up time for Moorland`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: 'custom',
          customPickUpTime: '1',
        })
        .expect(302)
        .expect('location', `/admin/edit-prison-details/MDI`)
        .expect(res => {
          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('MDI', user)
          expect(adminService.amendPrison).toHaveBeenCalledWith('MDI', { pickUpTime: 1 }, user)
        })
    })

    it(`should post 60 minute custom pick-up time for Moorland`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: 'custom',
          customPickUpTime: '60',
        })
        .expect(302)
        .expect('location', `/admin/edit-prison-details/MDI`)
        .expect(res => {
          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('MDI', user)
          expect(adminService.amendPrison).toHaveBeenCalledWith('MDI', { pickUpTime: 60 }, user)
        })
    })

    it(`should be no-op post for same pick-up time for Hewell`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(hewellPrison)
      adminService.amendPrison.mockResolvedValue(hewellPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${hewellPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: 'custom',
          customPickUpTime: '30',
        })
        .expect(302)
        .expect('location', `/admin/edit-prison-details/HEI`)
        .expect(res => {
          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('HEI', user)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })

    it(`should be no-op post for same pick-up time for Moorland`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'off',
        })
        .expect(302)
        .expect('location', `/admin/edit-prison-details/MDI`)
        .expect(res => {
          expect(prisonService.getPrisonByCode).toHaveBeenCalledWith('MDI', user)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })

    it(`should fail when no time period selected`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
        })
        .expect(302)
        .expect('location', '/')
        .expect(res => {
          expectErrorMessages([
            {
              fieldId: 'pickUpTime',
              href: '#pickUpTime',
              text: 'Select a time period',
            },
          ])
          expect(prisonService.getPrisonByCode).toHaveBeenCalledTimes(0)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })

    it(`should fail when nothing selected `, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({})
        .expect(302)
        .expect('location', '/')
        .expect(res => {
          expectErrorMessages([
            {
              fieldId: 'pickUpTimeOnOff',
              href: '#pickUpTimeOnOff',
              text: 'Select if pick-up times should be displayed on Video Link Daily Schedule',
            },
          ])
          expect(prisonService.getPrisonByCode).toHaveBeenCalledTimes(0)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })

    it(`should fail when no custom time period entered`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: 'custom',
        })
        .expect(302)
        .expect('location', '/')
        .expect(res => {
          expectErrorMessages([
            {
              fieldId: 'customPickUpTime',
              href: '#customPickUpTime',
              text: 'Custom time period must be a whole number, 20',
            },
          ])
          expect(prisonService.getPrisonByCode).toHaveBeenCalledTimes(0)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })

    it(`should fail when custom time period too small`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: 'custom',
          customPickUpTime: '0',
        })
        .expect(302)
        .expect('location', '/')
        .expect(res => {
          expectErrorMessages([
            {
              fieldId: 'customPickUpTime',
              href: '#customPickUpTime',
              text: 'Custom time period must be a whole number between 1 and 60',
            },
          ])
          expect(prisonService.getPrisonByCode).toHaveBeenCalledTimes(0)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })

    it(`should fail when custom time period too large`, () => {
      prisonService.getPrisonByCode.mockResolvedValue(moorlandPrison)
      adminService.amendPrison.mockResolvedValue(moorlandPrison)

      return request(app)
        .post(`/admin/edit-prison-details/${moorlandPrison.code}`)
        .send({
          pickUpTimeOnOff: 'on',
          pickUpTime: 'custom',
          customPickUpTime: '61',
        })
        .expect(302)
        .expect('location', '/')
        .expect(res => {
          expectErrorMessages([
            {
              fieldId: 'customPickUpTime',
              href: '#customPickUpTime',
              text: 'Custom time period must be a whole number between 1 and 60',
            },
          ])
          expect(prisonService.getPrisonByCode).toHaveBeenCalledTimes(0)
          expect(adminService.amendPrison).toHaveBeenCalledTimes(0)
        })
    })
  })
})
