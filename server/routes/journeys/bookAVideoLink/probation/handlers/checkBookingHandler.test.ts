import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { existsByDataQa, getPageHeader } from '../../../../testutils/cheerio'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import PrisonService from '../../../../../services/prisonService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import {
  AvailabilityResponse,
  Location,
  ProbationTeam,
  ReferenceCode,
} from '../../../../../@types/bookAVideoLinkApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'
import ProbationBookingService from '../../../../../services/probationBookingService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/probationBookingService')
jest.mock('../../../../../services/probationTeamsService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: {
      auditService,
      probationBookingService,
      probationTeamsService,
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
    bookAProbationMeeting: {
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
    probationTeamsService.getUserPreferences.mockResolvedValue([
      { code: 'P1', description: 'Probation 1' },
      { code: 'P2', description: 'Probation 2' },
    ] as ProbationTeam[])
    prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }] as Location[])
    referenceDataService.getProbationMeetingTypes.mockResolvedValue([
      { code: 'KEY', description: 'description' },
    ] as ReferenceCode[])
    probationBookingService.checkAvailability.mockResolvedValue({ availabilityOk: true } as AvailabilityResponse)
    videoLinkService.bookingIsAmendable.mockReturnValue(true)
  })

  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Check and confirm your booking')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.CHECK_BOOKING_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(referenceDataService.getProbationMeetingTypes).toHaveBeenCalledWith(user)
        })
    })

    it.each([
      ['should render the warning to consult the prison', true, true],
      ['should not render the warning to consult the prison', false, false],
    ])('%s', (_, serviceResult, expected) => {
      videoLinkService.prisonShouldBeWarnedOfBooking.mockReturnValue(serviceResult)

      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'discuss-before-proceeding')).toBe(expected)
        })
    })

    it('should not render the warning to consult a prison when requesting a booking', () => {
      return request(app)
        .get(`/probation/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'discuss-before-proceeding')).toBe(false)

          expect(videoLinkService.prisonShouldBeWarnedOfBooking).not.toHaveBeenCalled()
          expect(probationBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })

    it('should render the pending prison approval warning in request mode', () => {
      return request(app)
        .get(`/probation/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'pending-prison-approval')).toBe(true)
          expect(probationBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })

    it('should not render the pending prison approval warning in create mode', () => {
      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'pending-prison-approval')).toBe(false)
        })
    })

    it('should redirect to select alternatives if the selected room is not available', () => {
      probationBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)

      return request(app)
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .expect(302)
        .expect('location', 'availability')
    })
  })

  describe('POST', () => {
    it('should validate the comment being too long', () => {
      appSetup({ bookAProbationMeeting: { type: 'PROBATION' } })

      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
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

    it('should save the posted fields', () => {
      appSetup({ bookAProbationMeeting: { type: 'PROBATION' } })

      probationBookingService.createVideoLinkBooking.mockResolvedValue(1)

      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation/1')
        .expect(() => {
          expect(probationBookingService.createVideoLinkBooking).toHaveBeenCalledWith(
            {
              comments: 'comment',
              type: 'PROBATION',
            },
            user,
          )
        })
    })

    it('should redirect to select alternatives if the selected room is not available', () => {
      probationBookingService.checkAvailability.mockResolvedValue({ availabilityOk: false } as AvailabilityResponse)

      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'availability')
    })

    it('should amend the posted fields', () => {
      const bookAProbationMeeting = {
        bookingId: 1,
        date: '2024-06-27',
        startTime: '15:00',
      }

      appSetup({
        bookAProbationMeeting,
      })

      return request(app)
        .post(`/probation/booking/amend/1/${journeyId()}/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(probationBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
            { ...bookAProbationMeeting, comments: 'comment' },
            user,
          )
        })
    })

    it('should request a booking using the posted fields', () => {
      appSetup({ bookAProbationMeeting: { type: 'PROBATION' } })

      return request(app)
        .post(`/probation/booking/request/${journeyId()}/prisoner/video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation')
        .expect(() => {
          expect(probationBookingService.requestVideoLinkBooking).toHaveBeenCalledWith(
            {
              comments: 'comment',
              type: 'PROBATION',
            },
            user,
          )

          expect(probationBookingService.checkAvailability).not.toHaveBeenCalled()
        })
    })
  })
})
