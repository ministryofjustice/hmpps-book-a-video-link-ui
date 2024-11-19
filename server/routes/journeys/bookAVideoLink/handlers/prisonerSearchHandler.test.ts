import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
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
  appSetup()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner search handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/prisoner-search`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Search for a prisoner')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRISONER_SEARCH_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
    })
  })

  describe('POST', () => {
    const validForm = {
      firstName: 'Bob',
      lastName: 'Smith',
      dateOfBirth: { day: '02', month: '06', year: '1990' },
      prison: 'MDI',
      prisonerNumber: 'A1234AA',
      pncNumber: '2001/23456A',
    }

    it('should validate an empty form', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ dateOfBirth: {} })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'lastName',
              href: '#lastName',
              text: "You must search using either the prisoner's first name, last name, prison number or PNC Number",
            },
          ]),
        )
    })

    it('should validate that the date of birth is valid', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ ...validForm, dateOfBirth: { day: '31', month: '02', year: '1970' } })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'dateOfBirth',
              href: '#dateOfBirth',
              text: 'Enter a valid date',
            },
          ]),
        )
    })

    it('should validate that the date of birth is in the past', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ ...validForm, dateOfBirth: { day: '02', month: '06', year: '2300' } })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'dateOfBirth',
              href: '#dateOfBirth',
              text: 'Enter a date in the past',
            },
          ]),
        )
    })

    it('should validate that the prisoner number is in the correct format', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ ...validForm, prisonerNumber: 'ABC123' })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'prisonerNumber',
              href: '#prisonerNumber',
              text: 'Enter a prison number in the format A1234AA',
            },
          ]),
        )
    })

    it('should validate that the PNC number is in the correct format', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ ...validForm, pncNumber: '011/3456A' })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'pncNumber',
              href: '#pncNumber',
              text: 'Enter a PNC number in the format 01/23456A or 2001/23456A',
            },
          ]),
        )
    })

    it('should accept firstName on its own as the search criteria', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ dateOfBirth: {}, firstName: 'John' })
        .expect(() => expectNoErrorMessages())
    })

    it('should accept lastName on its own as the search criteria', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ dateOfBirth: {}, lastName: 'Smith' })
        .expect(() => expectNoErrorMessages())
    })

    it('should accept prisonerNumber on its own as the search criteria', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ dateOfBirth: {}, prisonerNumber: 'A1234AA' })
        .expect(() => expectNoErrorMessages())
    })

    it('should accept PNC number on its own as the search criteria', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send({ dateOfBirth: {}, pncNumber: '2001/23456A' })
        .expect(() => expectNoErrorMessages())
    })

    it('should hold the posted fields in session', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/prisoner-search`)
        .send(validForm)
        .expect(302)
        .expect('location', 'prisoner-search/results')
        .then(() =>
          expectJourneySession(app, 'bookAVideoLink', {
            search: {
              dateOfBirth: '1990-06-02T00:00:00.000Z',
              firstName: 'Bob',
              lastName: 'Smith',
              pncNumber: '2001/23456A',
              prison: 'MDI',
              prisonerNumber: 'A1234AA',
            },
          }),
        )
    })
  })
})
