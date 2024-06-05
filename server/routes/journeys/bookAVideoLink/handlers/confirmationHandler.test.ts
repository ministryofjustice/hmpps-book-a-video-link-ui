import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])('%s journey - should render the correct view page', (_: string, journey: string) => {
    auditService.logPageView.mockResolvedValue(null)

    return request(app)
      .get(`/booking/${journey}/create/${journeyId()}/ABC123/add-video-link-booking/confirmation/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('The video link has been booked')
        expect(bookAnotherLink).toEqual(`/booking/${journey}/create/prisoner-search`)
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })
})
