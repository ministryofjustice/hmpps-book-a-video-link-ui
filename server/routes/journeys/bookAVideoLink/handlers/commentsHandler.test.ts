import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookAVideoLink: {
      bookingId: 1001,
      date: '2024-06-12',
      startTime: '1970-01-01T16:00',
      comments: 'Test comment',
    },
  })

  videoLinkService.bookingIsAmendable.mockReturnValue(true)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Comments handler', () => {
  describe('GET', () => {
    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s journey - should render the correct view page', (_: string, journey: string) => {
      return request(app)
        .get(`/${journey}/booking/amend/1001/${journeyId()}/video-link-booking/comments`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const cancelLink = getByDataQa($, 'cancel-link').attr('href')

          expect(heading).toEqual('Change comments on this booking')
          expect(cancelLink).toEqual(`/${journey}/view-booking/1001`)
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.COMMENTS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })
})
