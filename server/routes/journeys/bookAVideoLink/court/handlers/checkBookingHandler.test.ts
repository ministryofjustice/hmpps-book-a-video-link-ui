import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { existsByDataQa, getPageHeader } from '../../../../testutils/cheerio'
import CourtsService from '../../../../../services/courtsService'
import PrisonService from '../../../../../services/prisonService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import { AvailabilityResponse, Court, Location, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/courtBookingService')
jest.mock('../../../../../services/courtsService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: {
      auditService,
      courtBookingService,
      courtsService,
      prisonService,
      referenceDataService,
      videoLinkService,
    },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookACourtHearing: {
      prisoner: { prisonId: 'MDI' },
      date: '2024-06-12',
      startTime: '1970-01-01T16:00',
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check Booking handler', () => {
  beforeEach(() => {
    courtsService.getUserPreferences.mockResolvedValue([
      { code: 'C1', description: 'Court 1' },
      { code: 'C2', description: 'Court 2' },
    ] as Court[])

    prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }] as Location[])

    referenceDataService.getCourtHearingTypes.mockResolvedValue([
      { code: 'KEY', description: 'description' },
    ] as ReferenceCode[])

    courtBookingService.checkAvailability.mockResolvedValue({ availabilityOk: true } as AvailabilityResponse)
    videoLinkService.bookingIsAmendable.mockReturnValue(true)
  })

  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Check and confirm your booking')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.CHECK_BOOKING_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(referenceDataService.getCourtHearingTypes).toHaveBeenCalledWith(user)
        })
    })

    it.each([
      ['should render the warning to consult the prison', true, true],
      ['should not render the warning to consult the prison', false, false],
    ])('%s', (_, serviceResult, expected) => {
      videoLinkService.prisonShouldBeWarnedOfBooking.mockReturnValue(serviceResult)
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'discuss-before-proceeding')).toBe(expected)
        })
    })

    it('should not render the warning to consult a prison when requesting a booking', () => {
      return request(app)
        .get(`/court/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'discuss-before-proceeding')).toBe(false)
          expect(videoLinkService.prisonShouldBeWarnedOfBooking).not.toHaveBeenCalled()
          expect(courtBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })

    it('should render the pending prison approval warning in request mode', () => {
      return request(app)
        .get(`/court/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'pending-prison-approval')).toBe(true)
          expect(courtBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })

    it('should not render the pending prison approval warning in create mode', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'pending-prison-approval')).toBe(false)
        })
    })

    it('should redirect to select alternatives if the selected room is not available', () => {
      courtBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect(302)
        .expect('location', 'not-available')
    })

    it('should validate the notes for staff length', () => {
      appSetup({ bookACourtHearing: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ notesForStaff: 'a'.repeat(401) })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'notesForStaff',
              href: '#notesForStaff',
              text: 'Notes for prison staff must be 400 characters or less',
            },
          ])
        })
    })

    it('should redirect to not available if the selected room is not available', () => {
      courtBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ notesForStaff: 'notes' })
        .expect(302)
        .expect('location', 'not-available')
    })

    it('should amend the posted fields', () => {
      const bookACourtHearing = { bookingId: 1, date: '2024-06-27', startTime: '15:00' }
      appSetup({ bookACourtHearing })

      return request(app)
        .post(`/court/booking/amend/1/${journeyId()}/video-link-booking/check-booking`)
        .send({ notesForStaff: 'notes' })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
            { ...bookACourtHearing, notesForStaff: 'notes' },
            user,
          )
        })
    })

    it('should request a booking with staff notes', () => {
      appSetup({ bookACourtHearing: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .send({ notesForStaff: 'notes' })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(courtBookingService.requestVideoLinkBooking).toHaveBeenCalledWith(
            {
              type: 'COURT',
              notesForStaff: 'notes',
            },
            user,
          )
          expect(courtBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })
  })
})
