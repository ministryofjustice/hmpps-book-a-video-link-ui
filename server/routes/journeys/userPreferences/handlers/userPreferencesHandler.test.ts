import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService, { CourtsByLetter } from '../../../../services/courtsService'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import { Court, ProbationTeam } from '../../../../@types/bookAVideoLinkApi/types'
import ProbationTeamsService from '../../../../services/probationTeamsService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, probationTeamsService },
    userSupplier: () => user,
  })

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

  courtsService.getUserPreferences.mockResolvedValue([])
  probationTeamsService.getUserPreferences.mockResolvedValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each([
  ['Probation', 'probation'],
  ['Court', 'court'],
])('User preferences handler', (_: string, journey: string) => {
  describe('GET', () => {
    it(`${_} - should render the correct view page when the user has not selected any preferences`, () => {
      return request(app)
        .get(`/${journey}/user-preferences`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('h1').text().trim()
          const checkedCheckboxes = $('input[type="checkbox"]:checked')

          expect(heading).toBe(`Manage your list of ${journey === 'court' ? 'courts' : 'probation teams'}`)
          expect(checkedCheckboxes.length).toBe(0)

          expect(auditService.logPageView).toHaveBeenCalledWith(Page.USER_PREFERENCES_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          if (journey === 'court') {
            expect(courtsService.getCourtsByLetter).toHaveBeenCalledWith(user)
            expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
            expect(probationTeamsService.getProbationTeamsByLetter).not.toHaveBeenCalled()
            expect(probationTeamsService.getUserPreferences).not.toHaveBeenCalled()
          } else {
            expect(probationTeamsService.getProbationTeamsByLetter).toHaveBeenCalledWith(user)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledWith(user)
            expect(courtsService.getCourtsByLetter).not.toHaveBeenCalled()
            expect(courtsService.getUserPreferences).not.toHaveBeenCalled()
          }
        })
    })

    it(`${_} - should pre-check the checkboxes where the user has selected some preferences`, () => {
      courtsService.getUserPreferences.mockResolvedValue([
        {
          code: 'ABERCV',
          description: 'Aberystwyth Civil',
        },
        {
          code: 'AYLSCC',
          description: 'Aylesbury Crown',
        },
      ] as unknown as Court[])

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

      return request(app)
        .get(`/${journey}/user-preferences`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const checkedCheckboxes = $('input[type="checkbox"]:checked')
          expect(checkedCheckboxes.length).toBe(2)
        })
    })
  })

  describe('POST', () => {
    it(`${_} - should validate empty form`, () => {
      return request(app)
        .post(`/${journey}/user-preferences`)
        .send({ selectedAgencies: [] })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'selectedAgencies',
              href: '#selectedAgencies',
              text: `You need to select at least one ${journey === 'court' ? 'court' : 'probation team'}`,
            },
          ])
        })
    })

    it(`${_} - should set user preferences and redirect to confirmation`, () => {
      return request(app)
        .post(`/${journey}/user-preferences`)
        .send({ selectedAgencies: ['TEST'] })
        .expect(302)
        .expect('location', `user-preferences/confirmation`)
        .expect(() => {
          if (journey === 'court') {
            expect(courtsService.setUserPreferences).toHaveBeenCalledWith(['TEST'], user)
            expect(probationTeamsService.setUserPreferences).not.toHaveBeenCalled()
          } else {
            expect(probationTeamsService.setUserPreferences).toHaveBeenCalledWith(['TEST'], user)
            expect(courtsService.setUserPreferences).not.toHaveBeenCalled()
          }
        })
    })
  })
})
