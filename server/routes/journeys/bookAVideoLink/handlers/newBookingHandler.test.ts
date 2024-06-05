import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { startOfToday, startOfTomorrow } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { existsByLabel, existsByName, getPageHeader } from '../../../testutils/cheerio'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import PrisonService from '../../../../services/prisonService'
import PrisonerService from '../../../../services/prisonerService'
import VideoLinkService from '../../../../services/videoLinkService'
import { expectErrorMessages } from '../../../testutils/expectErrorMessage'
import { formatDate } from '../../../../utils/utils'
import expectJourneySession from '../../../testutils/testUtilRoute'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/prisonerService')
jest.mock('../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const videoLinkService = new VideoLinkService(null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, probationTeamsService, prisonService, prisonerService, videoLinkService },
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

describe('New Booking handler', () => {
  describe('GET', () => {
    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s journey - should render the correct view page', (_: string, journey: string) => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({ prisonId: 'MDI' })
      courtsService.getUserPreferences.mockResolvedValue([
        { code: 'C1', description: 'Court 1' },
        { code: 'C2', description: 'Court 2' },
      ])
      probationTeamsService.getUserPreferences.mockResolvedValue([
        { code: 'P1', description: 'Probation 1' },
        { code: 'P2', description: 'Probation 2' },
      ])

      return request(app)
        .get(`/booking/${journey}/create/${journeyId()}/ABC123/add-video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Search for a video link booking')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          if (journey === 'court') {
            expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)
            expect(probationTeamsService.getUserPreferences).not.toHaveBeenCalled()
            expect(videoLinkService.getCourtHearingTypes).toHaveBeenCalledWith(user)
            expect(videoLinkService.getProbationMeetingTypes).not.toHaveBeenCalled()
            expect(existsByName($, 'preRequired')).toBe(true)
            expect(existsByName($, 'postRequired')).toBe(true)
            expect(existsByLabel($, 'Which court is the hearing for?')).toBe(true)
            expect(existsByLabel($, 'Which type of hearing is this?')).toBe(true)
          }

          if (journey === 'probation') {
            expect(courtsService.getUserPreferences).not.toHaveBeenCalled()
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledWith(user)
            expect(videoLinkService.getCourtHearingTypes).not.toHaveBeenCalled()
            expect(videoLinkService.getProbationMeetingTypes).toHaveBeenCalledWith(user)
            expect(existsByName($, 'preRequired')).toBe(false)
            expect(existsByName($, 'postRequired')).toBe(false)
            expect(existsByLabel($, 'Which probation team is the meeting for?')).toBe(true)
            expect(existsByLabel($, 'Which type of meeting is this?')).toBe(true)
          }
        })
    })
  })

  describe('POST', () => {
    const validForm = {
      agencyCode: 'CODE',
      hearingTypeCode: 'APPEAL',
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 15, minute: 30 },
      endTime: { hour: 16, minute: 30 },
      location: 'CODE',
      preRequired: 'no',
      postRequired: 'no',
      videoLinkUrl: 'https://www.google.co.uk',
    }

    it('should validate an empty form on the court journey', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'agencyCode',
              href: '#agencyCode',
              text: 'Select a court',
            },
            {
              fieldId: 'hearingTypeCode',
              href: '#hearingTypeCode',
              text: 'Select a hearing type',
            },
            {
              fieldId: 'date',
              href: '#date',
              text: 'Enter a date',
            },
            {
              fieldId: 'startTime',
              href: '#startTime',
              text: 'Enter a start time',
            },
            {
              fieldId: 'endTime',
              href: '#endTime',
              text: 'Enter an end time',
            },
            {
              fieldId: 'location',
              href: '#location',
              text: 'Select a prison room for the court hearing',
            },
            {
              fieldId: 'preRequired',
              href: '#preRequired',
              text: 'Select if a pre-court hearing should be added',
            },
            {
              fieldId: 'postRequired',
              href: '#postRequired',
              text: 'Select if a post-court hearing should be added',
            },
          ])
        })
    })

    it('should validate an empty form on the probation journey', () => {
      appSetup({ bookAVideoLink: { type: 'PROBATION' } })

      return request(app)
        .post(`/booking/probation/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'agencyCode',
              href: '#agencyCode',
              text: 'Select a probation team',
            },
            {
              fieldId: 'hearingTypeCode',
              href: '#hearingTypeCode',
              text: 'Select a hearing type',
            },
            {
              fieldId: 'date',
              href: '#date',
              text: 'Enter a date',
            },
            {
              fieldId: 'startTime',
              href: '#startTime',
              text: 'Enter a start time',
            },
            {
              fieldId: 'endTime',
              href: '#endTime',
              text: 'Enter an end time',
            },
            {
              fieldId: 'location',
              href: '#location',
              text: 'Select a prison room for the court hearing',
            },
          ])
        })
    })

    it('should validate that the pre and post location items are filled', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({
          ...validForm,
          preRequired: 'yes',
          postRequired: 'yes',
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'preLocation',
              href: '#preLocation',
              text: 'Select a prison room for the pre-court hearing',
            },
            {
              fieldId: 'postLocation',
              href: '#postLocation',
              text: 'Select a prison room for the post-court hearing',
            },
          ])
        })
    })

    it('should validate invalid fields', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({
          ...validForm,
          date: '31/02/2022',
          startTime: { hour: 25, minute: 30 },
          endTime: { hour: 25, minute: 30 },
          videoLinkUrl: 'invalid url',
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'date',
              href: '#date',
              text: 'Enter a valid date',
            },
            {
              fieldId: 'startTime',
              href: '#startTime',
              text: 'Enter a valid start time',
            },
            {
              fieldId: 'endTime',
              href: '#endTime',
              text: 'Enter a valid end time',
            },
            {
              fieldId: 'videoLinkUrl',
              href: '#videoLinkUrl',
              text: 'Enter a valid URL for the video link',
            },
          ])
        })
    })

    it('should validate that the date is in the future', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({
          ...validForm,
          date: formatDate(startOfToday(), 'dd/MM/yyyy'),
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'date',
              href: '#date',
              text: "Enter a date which is after today's date",
            },
          ])
        })
    })

    it('should validate that the start time is before the end time', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({
          ...validForm,
          startTime: { hour: 17, minute: 30 },
          endTime: { hour: 16, minute: 30 },
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'endTime',
              href: '#endTime',
              text: 'Select a end time that is after the start time',
            },
          ])
        })
    })

    it('should save the posted fields in session', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
        prisonId: 'MDI',
        prisonName: 'Moorland',
        prisonerNumber: 'ABC123',
        firstName: 'Joe',
        lastName: 'Bloggs',
      })

      return request(app)
        .post(`/booking/court/create/${journeyId()}/ABC123/add-video-link-booking`)
        .send({
          ...validForm,
          preRequired: 'yes',
          preLocation: 'PRE_LOCATION',
          postRequired: 'yes',
          postLocation: 'POST_LOCATION',
        })
        .expect(302)
        .expect('location', 'add-video-link-booking/check-booking')
        .then(() =>
          expectJourneySession(app, 'bookAVideoLink', {
            agencyCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            hearingTypeCode: 'APPEAL',
            locationCode: 'CODE',
            postHearingEndTime: '1970-01-01T16:45:00.000Z',
            postHearingStartTime: '1970-01-01T16:30:00.000Z',
            postLocationCode: 'POST_LOCATION',
            preHearingEndTime: '1970-01-01T15:30:00.000Z',
            preHearingStartTime: '1970-01-01T15:15:00.000Z',
            preLocationCode: 'PRE_LOCATION',
            prisoner: {
              name: 'Joe Bloggs',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'ABC123',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            type: 'COURT',
            videoLinkUrl: 'https://www.google.co.uk',
          }),
        )
    })
  })
})
