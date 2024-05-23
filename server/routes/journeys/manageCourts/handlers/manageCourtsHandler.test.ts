import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService, { CourtsByLetter } from '../../../../services/courtsService'
import expectErrorMessages from '../../../testutils/expectErrorMessage'
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
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Manage courts handler', () => {
  describe('GET /select-courts', () => {
    it('should render the correct view page', () => {
      auditService.logPageView.mockResolvedValue(null)

      return request(app)
        .get(`/manage-courts/${journeyId()}/select-courts`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = $('h1').text().trim()
          const checkedCheckboxes = $('input[type="checkbox"]:checked')

          expect(heading).toBe('Manage your list of courts')
          expect(checkedCheckboxes.length).toBe(2)

          expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_COURTS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })

  describe('POST /select-courts', () => {
    it('should validate empty form', () => {
      return request(app)
        .post(`/manage-courts/${journeyId()}/select-courts`)
        .send({ courts: [] })
        .expect(() => {
          expectErrorMessages([{ href: '#courts', text: 'You need to select at least one court' }])
        })
    })

    it('should set user preferences and redirect to confirmation', () => {
      return request(app)
        .post(`/manage-courts/${journeyId()}/select-courts`)
        .send({ courts: ['TEST'] })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(courtsService.setUserPreferences).toHaveBeenCalledWith(['TEST'], user)
        })
    })
  })
})
