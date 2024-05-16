import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService, { CourtsByLetter } from '../../../../services/courtsService'

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

describe('GET /', () => {
  it('should render the correct view page', () => {
    auditService.logPageView.mockResolvedValue(null)
    courtsService.getCourtsByLetter.mockResolvedValue({
      A: [
        {
          code: 'ABERCV',
          description: 'Aberystwyth Civil',
        },
        {
          code: 'AYLSCC',
          description: 'Aylesbury Crown',
        },
      ],
      G: [
        {
          code: 'GTSHMC',
          description: 'Gateshead Magistrates',
        },
      ],
      N: [
        {
          code: 'NEWPCC',
          description: 'Newport Crown',
        },
      ],
    } as unknown as CourtsByLetter)

    return request(app)
      .get('/manage-courts')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage your list of courts')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_COURTS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })
})
