import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import PrisonService from '../../../../../services/prisonService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { Prison } from '../../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonService')

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
  appSetup({ bookACourtHearing: {} })
  prisonService.getPrisons.mockResolvedValue([{ code: 'MDI', name: 'Moorland' }] as Prison[])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner details handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/request/${journeyId()}/prisoner/prisoner-details`)
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

    it('should validate an empty form', () => {
      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/prisoner-details`)
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

    it('should validate the date of birth being a valid date', () => {
      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/prisoner-details`)
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

    it('should validate the date of birth being in the past', () => {
      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/prisoner-details`)
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

    it('should save the prisoner details in session', () => {
      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/prisoner-details`)
        .send({ ...validForm })
        .expect(() => expectNoErrorMessages())
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
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
