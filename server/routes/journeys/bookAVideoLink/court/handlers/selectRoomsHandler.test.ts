import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { parse } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { existsByName, getPageHeader } from '../../../../testutils/cheerio'
import CourtsService from '../../../../../services/courtsService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { AvailableLocationsResponse, Court } from '../../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../../config'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/courtsService')
jest.mock('../../../../../services/courtBookingService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>

let app: Express

const journey = {
  prisoner: {
    firstName: 'Joe',
    lastName: 'Smith',
  },
  preHearingStartTime: parse('12:45', 'HH:mm', new Date(0)).toISOString(),
  preHearingEndTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
  startTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
  endTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
  postHearingStartTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
  postHearingEndTime: parse('14:15', 'HH:mm', new Date(0)).toISOString(),
}

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, courtBookingService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  config.featureToggles.alteredCourtJourneyEnabled = true

  appSetup({
    bookACourtHearing: journey,
  })

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[])

  courtBookingService.roomsAvailableByDateAndTime.mockResolvedValue({
    locations: [{ name: 'Video Link', startTime: '13:00', endTime: '14:00' }],
  } as AvailableLocationsResponse)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select rooms handler', () => {
  describe('GET', () => {
    it('should render the correct view page for pre, main and post', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Select rooms for Joe Smith's court hearings")
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ROOMS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenCalledTimes(3)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            parse('12:45', 'HH:mm', new Date(0)).toISOString(),
            parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            user,
          )
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            2,
            expect.anything(),
            parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            user,
          )
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            3,
            expect.anything(),
            parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            parse('14:15', 'HH:mm', new Date(0)).toISOString(),
            user,
          )

          expect(existsByName($, 'preLocation')).toBe(true)
          expect(existsByName($, 'location')).toBe(true)
          expect(existsByName($, 'postLocation ')).toBe(true)
        })
    })

    it('should render the correct view page for pre and main only', () => {
      appSetup({
        bookACourtHearing: {
          ...journey,
          postHearingStartTime: undefined,
          postHearingEndTime: undefined,
        },
      })

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Select rooms for Joe Smith's court hearings")
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ROOMS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenCalledTimes(2)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            parse('12:45', 'HH:mm', new Date(0)).toISOString(),
            parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            user,
          )
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            2,
            expect.anything(),
            parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            user,
          )

          expect(existsByName($, 'preLocation')).toBe(true)
          expect(existsByName($, 'location')).toBe(true)
          expect(existsByName($, 'postLocation ')).toBe(false)
        })
    })

    it('should render the correct view page for main and post only', () => {
      appSetup({
        bookACourtHearing: {
          ...journey,
          preHearingStartTime: undefined,
          preHearingEndTime: undefined,
        },
      })

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Select rooms for Joe Smith's court hearings")
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ROOMS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenCalledTimes(2)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            user,
          )
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenNthCalledWith(
            2,
            expect.anything(),
            parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            parse('14:15', 'HH:mm', new Date(0)).toISOString(),
            user,
          )

          expect(existsByName($, 'preLocation')).toBe(false)
          expect(existsByName($, 'location')).toBe(true)
          expect(existsByName($, 'postLocation ')).toBe(true)
        })
    })

    it('should render the correct view page for main only', () => {
      appSetup({
        bookACourtHearing: {
          ...journey,
          preHearingStartTime: undefined,
          preHearingEndTime: undefined,
          postHearingStartTime: undefined,
          postHearingEndTime: undefined,
        },
      })

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Select rooms for Joe Smith's court hearings")
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ROOMS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenCalledTimes(1)
          expect(courtBookingService.roomsAvailableByDateAndTime).toHaveBeenCalledWith(
            expect.anything(),
            parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            user,
          )

          expect(existsByName($, 'preLocation')).toBe(false)
          expect(existsByName($, 'location')).toBe(true)
          expect(existsByName($, 'postLocation ')).toBe(false)
        })
    })

    it('should redirect to not available if no locations are available', () => {
      courtBookingService.roomsAvailableByDateAndTime.mockResolvedValueOnce({
        locations: [],
      } as AvailableLocationsResponse)

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .expect(302)
        .expect('location', 'not-available')
    })
  })

  describe('POST', () => {
    const validForm = {
      location: 'LOCATION_1',
      preLocation: 'LOCATION_1',
      postLocation: 'LOCATION_1',
    }

    it('should validate an empty form', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'preLocation',
              href: '#preLocation',
              text: 'Select a prison room for the pre-court hearing',
            },
            {
              fieldId: 'location',
              href: '#location',
              text: 'Select a prison room for the main court hearing',
            },
            {
              fieldId: 'postLocation',
              href: '#postLocation',
              text: 'Select a prison room for the post-court hearing',
            },
          ])
        })
    })

    it('should allow pre and post to be empty if they are not required', () => {
      appSetup({
        bookACourtHearing: {
          startTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
          endTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
        },
      })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .send({
          ...validForm,
          preLocation: undefined,
          postLocation: undefined,
        })
        .expect(() => expectNoErrorMessages())
    })

    it('should save the posted fields in session', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-rooms`)
        .send(validForm)
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
            },
            preHearingStartTime: parse('12:45', 'HH:mm', new Date(0)).toISOString(),
            preHearingEndTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            startTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
            endTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            postHearingStartTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
            postHearingEndTime: parse('14:15', 'HH:mm', new Date(0)).toISOString(),
            locationCode: 'LOCATION_1',
            preLocationCode: 'LOCATION_1',
            postLocationCode: 'LOCATION_1',
          }),
        )
    })
  })
})
