import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { ProbationTeam } from '../../../../@types/bookAVideoLinkApi/types'

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

describe('GET', () => {
  it('should render the correct view page', () => {
    auditService.logPageView.mockResolvedValue(null)
    probationTeamsService.getUserPreferences.mockResolvedValue([
      {
        code: 'LANCCE',
        description: 'Central Lancashire',
      },
    ] as unknown as ProbationTeam[])

    return request(app)
      .get(`/manage-probation-teams/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Your probation team list has been updated')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_PROBATION_TEAMS_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })
})
