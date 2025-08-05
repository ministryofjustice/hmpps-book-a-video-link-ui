import request from 'supertest'
import * as cheerio from 'cheerio'
import { Express } from 'express'
import { Readable } from 'node:stream'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService from '../../../../services/auditService'
import VideoLinkService from '../../../../services/videoLinkService'

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

  videoLinkService.downloadPrisonRoomConfigurationData.mockImplementation(res => {
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

describe('Extract prison room config handler', () => {
  describe('GET', () => {
    it('should show launch form content correctly', () => {
      return request(app)
        .get(`/admin/extract-prison-room-configuration`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('h1').text().trim()

          expect(heading).toBe(`Extract room configuration data for all prisons`)
        })
    })
  })

  describe('POST', () => {
    it(`should download CSV room configuration data`, () => {
      return request(app)
        .post(`/admin/extract-prison-room-configuration`)
        .expect(res => {
          expect(res.headers['content-disposition']).toBe('attachment; filename="file.csv"')
          expect(videoLinkService.downloadPrisonRoomConfigurationData).toHaveBeenCalledWith(expect.anything(), user)
        })
    })
  })
})
