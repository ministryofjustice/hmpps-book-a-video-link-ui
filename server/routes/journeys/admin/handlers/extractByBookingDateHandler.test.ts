import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfToday, startOfTomorrow } from 'date-fns'
import { Readable } from 'node:stream'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import VideoLinkService from '../../../../services/videoLinkService'
import { formatDate } from '../../../../utils/utils'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService },
    userSupplier: () => user,
  })

  videoLinkService.downloadBookingDataByBookingDate.mockImplementation((agencyType, date, daysToExtract, res) => {
    return new Promise(() => {
      res.set('content-disposition', 'attachment; filename="file.csv"')

      const stream = new Readable()
      stream.push('Hello, ')
      stream.push('world!')
      stream.push(null) // No more data
      stream.pipe(res)
    })
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Extract by booking date handler', () => {
  describe('GET', () => {
    it(`should render the correct view`, () => {
      return request(app)
        .get(`/admin/extract-by-booking-date`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('h1').text().trim()

          expect(heading).toBe(`Extract summary data by booking date`)
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.EXTRACT_BY_BOOKING_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })

  describe('POST', () => {
    it(`should validate empty form`, () => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type: '', startDate: '', numberOfDays: '' })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'type',
              href: '#type',
              text: 'Select either court or probation',
            },
            {
              fieldId: 'startDate',
              href: '#startDate',
              text: 'Enter a start date',
            },
            {
              fieldId: 'numberOfDays',
              href: '#numberOfDays',
              text: 'Enter a whole number between 1 and 365',
            },
          ])
        })
    })

    it(`should validate start date is valid`, () => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type: 'court', startDate: '2024-02-30', numberOfDays: '7' })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'startDate',
              href: '#startDate',
              text: 'Enter a valid start date',
            },
          ])
        })
    })

    it(`should validate start date is in the past`, () => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type: 'court', startDate: formatDate(startOfTomorrow(), 'dd/MM/yyyy'), numberOfDays: '7' })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'startDate',
              href: '#startDate',
              text: "Enter a date which is before or on today's date",
            },
          ])
        })
    })

    it(`should validate numberOfDays is a number`, () => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type: 'court', startDate: formatDate(startOfToday(), 'dd/MM/yyyy'), numberOfDays: 'test' })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'numberOfDays',
              href: '#numberOfDays',
              text: 'Enter a whole number between 1 and 365',
            },
          ])
        })
    })

    it(`should validate numberOfDays is less than 365`, () => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type: 'court', startDate: formatDate(startOfToday(), 'dd/MM/yyyy'), numberOfDays: '366' })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'numberOfDays',
              href: '#numberOfDays',
              text: 'Enter a whole number between 1 and 365',
            },
          ])
        })
    })

    it(`should validate numberOfDays is more than than 0`, () => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type: 'court', startDate: formatDate(startOfToday(), 'dd/MM/yyyy'), numberOfDays: '0' })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'numberOfDays',
              href: '#numberOfDays',
              text: 'Enter a whole number between 1 and 365',
            },
          ])
        })
    })

    it.each(['court', 'probation'])(`should download a %s CSV`, (type: string) => {
      return request(app)
        .post(`/admin/extract-by-booking-date`)
        .send({ type, startDate: formatDate(startOfToday(), 'dd/MM/yyyy'), numberOfDays: '7' })
        .expect(res => {
          expect(res.headers['content-disposition']).toBe('attachment; filename="file.csv"')

          expect(videoLinkService.downloadBookingDataByBookingDate).toHaveBeenCalledWith(
            type,
            startOfToday(),
            7,
            expect.anything(),
            user,
          )
        })
    })
  })
})
