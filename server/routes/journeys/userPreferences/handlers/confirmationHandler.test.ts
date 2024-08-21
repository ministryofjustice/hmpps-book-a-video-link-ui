import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService from '../../../../services/courtsService'
import { Court, ProbationTeam } from '../../../../@types/bookAVideoLinkApi/types'
import ProbationTeamsService from '../../../../services/probationTeamsService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, probationTeamsService },
    userSupplier: () => user,
  })

  courtsService.getUserPreferences.mockResolvedValue([
    {
      code: 'ABERCV',
      description: 'Aberystwyth Civil',
    },
  ] as Court[])
  probationTeamsService.getUserPreferences.mockResolvedValue([
    {
      code: 'LANCCE',
      description: 'Central Lancashire',
    },
  ] as ProbationTeam[])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each([
  ['Probation', 'probation'],
  ['Court', 'court'],
])('GET', (_: string, journey: string) => {
  it('should render the correct view page', () => {
    return request(app)
      .get(`/${journey}/user-preferences/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = $('h1').text().trim()

        expect(heading).toBe(`Your ${journey === 'court' ? 'court' : 'probation team'} list has been updated`)
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.USER_PREFERENCES_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        if (journey === 'court') {
          expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
          expect(probationTeamsService.getUserPreferences).not.toHaveBeenCalled()
        } else {
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledWith(user)
          expect(courtsService.getUserPreferences).not.toHaveBeenCalled()
        }
      })
  })
})
