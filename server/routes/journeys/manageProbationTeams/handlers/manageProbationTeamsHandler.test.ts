import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ProbationTeamsService, { ProbationTeamsByLetter } from '../../../../services/probationTeamsService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/probationTeamsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService, probationTeamsService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render the correct view page', () => {
    auditService.logPageView.mockResolvedValue(null)
    probationTeamsService.getProbationTeamsByLetter.mockResolvedValue({
      C: [
        {
          code: 'LANCCE',
          description: 'Central Lancashire',
        },
        {
          code: 'CROYCC',
          description: 'Croydon MC',
        },
      ],
      H: [
        {
          code: 'HARROW',
          description: 'Harrow',
        },
      ],
      R: [
        {
          code: 'PPOCFD',
          description: 'Redbridge',
        },
      ],
    } as unknown as ProbationTeamsByLetter)

    return request(app)
      .get('/manage-probation-teams')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage your list of probation teams')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_PROBATION_TEAMS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })
})
