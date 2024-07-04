import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getPageHeader } from '../../../testutils/cheerio'
import PrisonService from '../../../../services/prisonService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../testutils/testUtilRoute'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, prisonService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({ bookAVideoLink: {} })
  prisonService.getPrisons.mockResolvedValue([{ code: 'MDI', name: 'Moorland' }])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner details handler', () => {
  describe('GET', () => {
    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s - should render the correct view page', (_: string, journey) => {
      return request(app)
        .get(`/${journey}/booking/request/${journeyId()}/prisoner/prisoner-details`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Who is the video link for?')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.UNKNOWN_PRISONER_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })

  describe('POST', () => {
    const validForm = {
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: { day: '01', month: '01', year: '1970' },
      prison: 'MDI',
    }

    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s - should validate an empty form', (_: string, journey) => {
      return request(app)
        .post(`/${journey}/booking/request/${journeyId()}/prisoner/prisoner-details`)
        .send({ dateOfBirth: {} })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'firstName',
              href: '#firstName',
              text: 'Enter a first name',
            },
            {
              fieldId: 'lastName',
              href: '#lastName',
              text: 'Enter a last name',
            },
            {
              fieldId: 'dateOfBirth',
              href: '#dateOfBirth',
              text: 'Enter a date of birth',
            },
            {
              fieldId: 'prison',
              href: '#prison',
              text: 'Select a prison',
            },
          ])
        })
    })

    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s - should validate the date of birth being a valid date', (_: string, journey) => {
      return request(app)
        .post(`/${journey}/booking/request/${journeyId()}/prisoner/prisoner-details`)
        .send({ ...validForm, dateOfBirth: { day: '30', month: '02', year: '1970' } })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'dateOfBirth',
              href: '#dateOfBirth',
              text: 'Enter a valid date of birth',
            },
          ])
        })
    })

    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s - should validate the date of birth being in the past', (_: string, journey) => {
      return request(app)
        .post(`/${journey}/booking/request/${journeyId()}/prisoner/prisoner-details`)
        .send({ ...validForm, dateOfBirth: { day: '01', month: '01', year: '2100' } })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'dateOfBirth',
              href: '#dateOfBirth',
              text: 'Enter a date in the past',
            },
          ])
        })
    })

    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s - should save the prisoner details in session', (_: string, journey) => {
      return request(app)
        .post(`/${journey}/booking/request/${journeyId()}/prisoner/prisoner-details`)
        .send({ ...validForm })
        .expect(() => expectNoErrorMessages())
        .then(() =>
          expectJourneySession(app, 'bookAVideoLink', {
            prisoner: {
              firstName: 'John',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01T00:00:00.000Z',
              prisonId: 'MDI',
              prisonName: 'Moorland',
            },
          }),
        )
    })
  })
})
