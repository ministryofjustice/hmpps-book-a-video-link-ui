import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { startOfToday, startOfTomorrow, startOfYesterday } from 'date-fns'
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
import { VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'

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
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, probationTeamsService, prisonService, prisonerService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  const bookAVideoLink = {
    search: {
      prisonerNumber: 'A1234AA',
    },
  }

  appSetup({ bookAVideoLink })

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ])
  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ])

  prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
    prisonId: 'MDI',
    firstName: 'Joe',
    lastName: 'Smith',
  })

  videoLinkService.getVideoLinkBookingById.mockResolvedValue({
    bookingType: 'COURT',
    prisonAppointments: [
      {
        prisonerNumber: 'A1234AA',
        appointmentType: 'VLB_COURT_MAIN',
        appointmentDate: '2024-02-01',
        startTime: '08:00',
        endTime: '09:00',
        prisonLocKey: 'LOCATION_CODE',
      },
    ],
    courtCode: 'COURT_CODE',
    courtHearingType: 'APPEAL',
    videoLinkUrl: 'http://example.com',
    comments: 'test',
  } as VideoLinkBooking)
  videoLinkService.bookingIsAmendable.mockReturnValue(true)
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
      return request(app)
        .get(`/${journey}/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
            expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
            expect(videoLinkService.getCourtHearingTypes).toHaveBeenCalledWith(user)
            expect(videoLinkService.getProbationMeetingTypes).not.toHaveBeenCalled()
            expect(existsByName($, 'preRequired')).toBe(true)
            expect(existsByName($, 'postRequired')).toBe(true)
            expect(existsByLabel($, 'Which court is the hearing for?')).toBe(true)
            expect(existsByLabel($, 'Which type of hearing is this?')).toBe(true)
          }

          if (journey === 'probation') {
            expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
            expect(videoLinkService.getCourtHearingTypes).not.toHaveBeenCalled()
            expect(videoLinkService.getProbationMeetingTypes).toHaveBeenCalledWith(user)
            expect(existsByName($, 'preRequired')).toBe(false)
            expect(existsByName($, 'postRequired')).toBe(false)
            expect(existsByLabel($, 'Which probation team is the meeting for?')).toBe(true)
            expect(existsByLabel($, 'Which type of meeting is this?')).toBe(true)
          }
        })
    })

    it.each([
      ['Probation', 'probation'],
      ['Court', 'court'],
    ])('%s journey - should return home if there is no journey in session', (_: string, journey: string) => {
      appSetup()

      return request(app)
        .get(`/${journey}/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .expect(302)
        .expect('location', '/')
    })

    it('should populate the session with an existing booking for amending', async () => {
      appSetup()

      await request(app)
        .get(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Change video link booking')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
        .then(() =>
          expectJourneySession(app, 'bookAVideoLink', {
            type: 'COURT',
            agencyCode: 'COURT_CODE',
            bookingId: 1,
            date: '2024-02-01T00:00:00.000Z',
            startTime: '1970-01-01T08:00:00.000Z',
            endTime: '1970-01-01T09:00:00.000Z',
            hearingTypeCode: 'APPEAL',
            locationCode: 'LOCATION_CODE',
            prisoner: {
              name: 'Joe Smith',
              prisonId: 'MDI',
            },
            videoLinkUrl: 'http://example.com',
            comments: 'test',
          }),
        )

      expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('A1234AA', user)
    })

    it('should redirect to to view the booking if the booking is not amendable', async () => {
      appSetup()

      videoLinkService.bookingIsAmendable.mockReturnValue(false)

      return request(app)
        .get(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect(302)
        .expect('location', '/court/view-booking/1')
        .then(() => expectJourneySession(app, 'bookAVideoLink', null))
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
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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

    it('should validate that the date is on or after today', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          date: formatDate(startOfYesterday(), 'dd/MM/yyyy'),
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'date',
              href: '#date',
              text: "Enter a date which is on or after today's date",
            },
          ])
        })
    })

    it('should validate that the start time is more than 15 minutes into the future', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          date: formatDate(startOfToday(), 'dd/MM/yyyy'),
          startTime: { hour: '00', minute: '00' },
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'startTime',
              href: '#startTime',
              text: 'Enter a time which is at least 15 minutes in the future',
            },
          ])
        })
    })

    it('should validate that the start time is before the end time', () => {
      appSetup({ bookAVideoLink: { type: 'COURT' } })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
        prisonerNumber: 'A1234AA',
        firstName: 'Joe',
        lastName: 'Bloggs',
      })

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          preRequired: 'yes',
          preLocation: 'PRE_LOCATION',
          postRequired: 'yes',
          postLocation: 'POST_LOCATION',
        })
        .expect(302)
        .expect('location', 'video-link-booking/check-booking')
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
              prisonerNumber: 'A1234AA',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            type: 'COURT',
            videoLinkUrl: 'https://www.google.co.uk',
          }),
        )
    })
  })
})
