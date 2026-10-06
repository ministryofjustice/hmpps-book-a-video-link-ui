import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import PrisonService from '../../../../../services/prisonService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import TelemetryService from '../../../../../services/telemetryService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/telemetryService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const telemetryService = new TelemetryService(null) as jest.Mocked<TelemetryService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, prisonService, telemetryService },
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
        .get(`/court/prisoner-search/${journeyId()}/search`)
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
        .post(`/court/prisoner-search/${journeyId()}/search`)
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
        .expect(() => expect(telemetryService.trackEvent).not.toHaveBeenCalled())
    })

    it('should validate that the date of birth is valid', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
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
        .expect(() => expect(telemetryService.trackEvent).not.toHaveBeenCalled())
    })

    it('should validate that the date of birth is in the past', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
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
        .expect(() => expect(telemetryService.trackEvent).not.toHaveBeenCalled())
    })

    it('should validate that the prisoner number is in the correct format', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
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
        .expect(() => expect(telemetryService.trackEvent).not.toHaveBeenCalled())
    })

    it('should validate that the PNC number is in the correct format', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
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
        .expect(() => expect(telemetryService.trackEvent).not.toHaveBeenCalled())
    })

    it('should accept firstName on its own as the search criteria', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
        .send({ dateOfBirth: {}, firstName: 'John' })
        .expect(() => expectNoErrorMessages())
        .expect(() =>
          expect(telemetryService.trackEvent).toHaveBeenCalledWith('BVLS_PrisonerSearch', {
            journeyType: 'court',
            hasFirstName: 'true',
            hasLastName: 'false',
            hasDateOfBirth: 'false',
            hasPrison: 'false',
            hasPrisonerNumber: 'false',
            hasPncNumber: 'false',
            appliedFilters: 'firstName',
            userId: user.jwtUserId,
            userUuid: user.jwtUserUuid,
          }),
        )
    })

    it('should accept lastName on its own as the search criteria', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
        .send({ dateOfBirth: {}, lastName: 'Smith' })
        .expect(() => expectNoErrorMessages())
        .expect(() =>
          expect(telemetryService.trackEvent).toHaveBeenCalledWith('BVLS_PrisonerSearch', {
            journeyType: 'court',
            hasFirstName: 'false',
            hasLastName: 'true',
            hasDateOfBirth: 'false',
            hasPrison: 'false',
            hasPrisonerNumber: 'false',
            hasPncNumber: 'false',
            appliedFilters: 'lastName',
            userId: user.jwtUserId,
            userUuid: user.jwtUserUuid,
          }),
        )
    })

    it('should accept prisonerNumber on its own as the search criteria', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
        .send({ dateOfBirth: {}, prisonerNumber: 'A1234AA' })
        .expect(() => expectNoErrorMessages())
        .expect(() =>
          expect(telemetryService.trackEvent).toHaveBeenCalledWith('BVLS_PrisonerSearch', {
            journeyType: 'court',
            hasFirstName: 'false',
            hasLastName: 'false',
            hasDateOfBirth: 'false',
            hasPrison: 'false',
            hasPrisonerNumber: 'true',
            hasPncNumber: 'false',
            appliedFilters: 'prisonerNumber',
            userId: user.jwtUserId,
            userUuid: user.jwtUserUuid,
          }),
        )
    })

    it('should accept PNC number on its own as the search criteria', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
        .send({ dateOfBirth: {}, pncNumber: '2001/23456A' })
        .expect(() => expectNoErrorMessages())
        .expect(() =>
          expect(telemetryService.trackEvent).toHaveBeenCalledWith('BVLS_PrisonerSearch', {
            journeyType: 'court',
            hasFirstName: 'false',
            hasLastName: 'false',
            hasDateOfBirth: 'false',
            hasPrison: 'false',
            hasPrisonerNumber: 'false',
            hasPncNumber: 'true',
            appliedFilters: 'pncNumber',
            userId: user.jwtUserId,
            userUuid: user.jwtUserUuid,
          }),
        )
    })

    it('should hold the posted fields in session', () => {
      return request(app)
        .post(`/court/prisoner-search/${journeyId()}/search`)
        .send(validForm)
        .expect(302)
        .expect('location', 'results')
        .then(() =>
          expectJourneySession(app, 'prisonerSearch', {
            dateOfBirth: '1990-06-02',
            firstName: 'Bob',
            lastName: 'Smith',
            pncNumber: '2001/23456A',
            prison: 'MDI',
            prisonerNumber: 'A1234AA',
          }),
        )
        .then(() =>
          expect(telemetryService.trackEvent).toHaveBeenCalledWith('BVLS_PrisonerSearch', {
            journeyType: 'court',
            hasFirstName: 'true',
            hasLastName: 'true',
            hasDateOfBirth: 'true',
            hasPrison: 'true',
            hasPrisonerNumber: 'true',
            hasPncNumber: 'true',
            appliedFilters: 'dateOfBirth,firstName,lastName,pncNumber,prison,prisonerNumber',
            userId: user.jwtUserId,
            userUuid: user.jwtUserUuid,
          }),
        )
    })
  })
})
