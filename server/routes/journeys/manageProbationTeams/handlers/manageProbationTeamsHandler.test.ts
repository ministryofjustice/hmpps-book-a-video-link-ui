import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ProbationTeamsService, { ProbationTeamsByLetter } from '../../../../services/probationTeamsService'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
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

  probationTeamsService.getUserPreferences.mockResolvedValue([
    {
      code: 'LANCCE',
      description: 'Central Lancashire',
    },
    {
      code: 'CROYCC',
      description: 'Croydon MC',
    },
  ] as unknown as ProbationTeam[])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Manage probation teams handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      auditService.logPageView.mockResolvedValue(null)

      return request(app)
        .get(`/manage-probation-teams`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('h1').text().trim()
          const checkedCheckboxes = $('input[type="checkbox"]:checked')

          expect(heading).toBe('Manage your list of probation teams')
          expect(checkedCheckboxes.length).toBe(2)

          expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_PROBATION_TEAMS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })

  describe('POST', () => {
    it('should validate empty form', () => {
      return request(app)
        .post(`/manage-probation-teams`)
        .send({ probationTeams: [] })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'probationTeams',
              href: '#probationTeams',
              text: 'You need to select at least one probation team',
            },
          ])
        })
    })

    it('should set user preferences and redirect to confirmation', () => {
      return request(app)
        .post(`/manage-probation-teams`)
        .send({ probationTeams: ['TEST'] })
        .expect(302)
        .expect('location', '/manage-probation-teams/confirmation')
        .expect(() => {
          expect(probationTeamsService.setUserPreferences).toHaveBeenCalledWith(['TEST'], user)
        })
    })
  })
})
