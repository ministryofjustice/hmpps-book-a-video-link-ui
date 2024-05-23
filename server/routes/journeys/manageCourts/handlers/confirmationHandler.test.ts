import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService from '../../../../services/courtsService'
import { Court } from '../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService, courtsService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /confirmation', () => {
  it('should render the correct view page', () => {
    auditService.logPageView.mockResolvedValue(null)
    courtsService.getUserPreferences.mockResolvedValue([
      {
        code: 'ABERCV',
        description: 'Aberystwyth Civil',
      },
    ] as unknown as Court[])

    return request(app)
      .get(`/manage-courts/${journeyId()}/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Your court list has been updated')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_COURTS_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })
})
