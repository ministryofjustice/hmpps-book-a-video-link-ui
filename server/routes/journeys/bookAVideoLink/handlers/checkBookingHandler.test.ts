import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { existsByDataQa, getPageHeader } from '../../../testutils/cheerio'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import PrisonService from '../../../../services/prisonService'
import VideoLinkService from '../../../../services/videoLinkService'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../testutils/testUtilRoute'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const videoLinkService = new VideoLinkService(null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, probationTeamsService, prisonService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookAVideoLink: {
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
    ])
    probationTeamsService.getUserPreferences.mockResolvedValue([
      { code: 'P1', description: 'Probation 1' },
      { code: 'P2', description: 'Probation 2' },
    ])
    prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }])
    videoLinkService.getCourtHearingTypes.mockResolvedValue([{ code: 'KEY', description: 'description' }])
    videoLinkService.getProbationMeetingTypes.mockResolvedValue([{ code: 'KEY', description: 'description' }])
  })

  describe('GET', () => {
    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s journey - should render the correct view page', (_: string, journey: string) => {
      return request(app)
        .get(`/booking/${journey}/create/${journeyId()}/ABC123/add-video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Check and confirm your booking')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.CHECK_BOOKING_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          if (journey === 'court') {
            expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
            expect(videoLinkService.getCourtHearingTypes).toHaveBeenCalledWith(user)
            expect(videoLinkService.getProbationMeetingTypes).not.toHaveBeenCalled()
          }

          if (journey === 'probation') {
            expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
            expect(videoLinkService.getCourtHearingTypes).not.toHaveBeenCalled()
            expect(videoLinkService.getProbationMeetingTypes).toHaveBeenCalledWith(user)
          }
        })
    })

    it.each([
      ['should render the warning to consult the prison', true, true],
      ['should not render the warning to consult the prison', false, false],
    ])('%s', (_, serviceResult, expected) => {
      videoLinkService.prisonShouldBeWarnedOfBooking.mockReturnValue(serviceResult)

      return request(app)
        .get(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking/check-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(existsByDataQa($, 'discuss-before-proceeding')).toBe(expected)
        })
    })
  })

  describe('POST', () => {
    it('should validate the comment being too long', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking/check-booking`)
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

    it('should save the posted fields', async () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      videoLinkService.createVideoLinkBooking.mockResolvedValue(1)

      await request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking/check-booking`)
        .send({ comments: 'comment' })
        .expect(302)
        .expect('location', 'confirmation/1')
        .then(() => expectJourneySession(app, 'bookAVideoLink', null))

      expect(videoLinkService.createVideoLinkBooking).toHaveBeenCalledWith(
        {
          comments: 'comment',
          type: 'COURT',
        },
        user,
      )
    })
  })
})
