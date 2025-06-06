import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { existsByDataQa, existsByKey, existsByLabel, getPageHeader } from '../../../../testutils/cheerio'
import CourtsService from '../../../../../services/courtsService'
import PrisonService from '../../../../../services/prisonService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import { AvailabilityResponse, Court, Location, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'
import CourtBookingService from '../../../../../services/courtBookingService'
import config from '../../../../../config'

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
  config.featureToggles.masterPublicPrivateNotes = false

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

    it('should prompt for comments when staff notes feature toggle is off', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByLabel($, 'Comments (optional)')).toBe(true)
          expect(existsByKey($, 'Notes for prison staff')).toBe(false)
        })
    })

    it('should not prompt for comments when staff notes feature toggle is on', () => {
      config.featureToggles.masterPublicPrivateNotes = true
      appSetup({
        bookACourtHearing: {
          prisoner: { prisonId: 'MDI' },
          date: '2024-06-12',
          startTime: '1970-01-01T16:00',
        },
      })

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByLabel($, 'Comments (optional)')).toBe(false)
          expect(existsByKey($, 'Notes for prison staff')).toBe(true)
        })
    })
  })

  describe('POST', () => {
    it('should validate the comment length when staff note feature is toggled off', () => {
      appSetup({ bookACourtHearing: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'a'.repeat(401) })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'comments',
              href: '#comments',
              text: 'Comments must be 400 characters or less',
            },
          ])
        })
    })

    it('should not validate comments when staff note feature is toggled on', () => {
      config.featureToggles.masterPublicPrivateNotes = true
      appSetup({ bookACourtHearing: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'a'.repeat(401) })
        .expect(() => {
          expectNoErrorMessages()
        })
    })

    it('should not validate notes for staff when staff note feature is toggled off', () => {
      config.featureToggles.masterPublicPrivateNotes = false
      appSetup({ bookACourtHearing: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ notesForStaff: 'a'.repeat(401) })
        .expect(() => {
          expectNoErrorMessages()
        })
    })

    it('should validate the notes for staff length when staff note feature is toggled on', () => {
      config.featureToggles.masterPublicPrivateNotes = true
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

    it('should save the posted fields when staff note feature is toggled off', () => {
      appSetup({ bookACourtHearing: { type: 'COURT' } })
      courtBookingService.createVideoLinkBooking.mockResolvedValue(1)

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation/1')
        .expect(() => {
          expect(courtBookingService.createVideoLinkBooking).toHaveBeenCalledWith(
            {
              comments: 'comment',
              type: 'COURT',
            },
            user,
          )
        })
    })

    it('should not save any comments when staff notes feature is toggled on', () => {
      config.featureToggles.masterPublicPrivateNotes = true
      appSetup({ bookACourtHearing: { type: 'COURT' } })
      courtBookingService.createVideoLinkBooking.mockResolvedValue(1)

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'comment', notesForStaff: 'notes' })
        .expect(302)
        .expect('location', 'confirmation/1')
        .expect(() => {
          expect(courtBookingService.createVideoLinkBooking).toHaveBeenCalledWith(
            {
              comments: undefined,
              notesForStaff: 'notes',
              type: 'COURT',
            },
            user,
          )
        })
    })

    it('should redirect to not available if the selected room is not available', () => {
      courtBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'not-available')
    })

    it('should amend the posted fields', () => {
      const bookACourtHearing = { bookingId: 1, date: '2024-06-27', startTime: '15:00' }
      appSetup({ bookACourtHearing })

      return request(app)
        .post(`/court/booking/amend/1/${journeyId()}/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
            { ...bookACourtHearing, comments: 'comment' },
            user,
          )
        })
    })

    it('should amend the posted notes for staff when toggled on', () => {
      config.featureToggles.masterPublicPrivateNotes = true
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

    it('should request a booking with comments when staff notes feature is toggled off', () => {
      appSetup({ bookACourtHearing: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(courtBookingService.requestVideoLinkBooking).toHaveBeenCalledWith(
            {
              comments: 'comment',
              type: 'COURT',
            },
            user,
          )
          expect(courtBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })

    it('should request a booking with staff notes when feature is toggled on', () => {
      config.featureToggles.masterPublicPrivateNotes = true
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
