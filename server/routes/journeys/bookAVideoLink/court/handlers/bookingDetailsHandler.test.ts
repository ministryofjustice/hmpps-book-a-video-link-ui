import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfToday, startOfTomorrow, startOfYesterday } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { existsByLabel, getPageHeader } from '../../../../testutils/cheerio'
import CourtsService from '../../../../../services/courtsService'
import PrisonService from '../../../../../services/prisonService'
import PrisonerService from '../../../../../services/prisonerService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import { formatDate } from '../../../../../utils/utils'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { Court, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/courtsService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/prisonerService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, prisonService, prisonerService, referenceDataService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup()

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[])

  prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
    prisonId: 'MDI',
    firstName: 'Joe',
    lastName: 'Smith',
    dateOfBirth: '1970-01-01',
    prisonName: 'Moorland',
    prisonerNumber: 'A1234AA',
  } as Prisoner)

  videoLinkService.getVideoLinkBookingById.mockResolvedValue({
    bookingType: 'COURT',
    prisonAppointments: [
      {
        prisonerNumber: 'A1234AA',
        appointmentType: 'VLB_COURT_MAIN',
        appointmentDate: formatDate(startOfTomorrow(), 'yyyy-MM-dd'),
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

describe('Booking details handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Select a date and time for Joe Smith's court hearings")
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(referenceDataService.getCourtHearingTypes).toHaveBeenCalledWith(user)
          expect(courtsService.getUserPreferences).toHaveBeenCalledWith(user)

          expect(existsByLabel($, 'Select the court the hearing is for')).toBe(true)
          expect(existsByLabel($, 'Select the court hearing type')).toBe(true)
        })
    })

    it('should get the prisoner information from the session for the request journey', () => {
      appSetup({
        bookACourtHearing: {
          prisoner: {
            prisonId: 'MDI',
            firstName: 'Joe',
            lastName: 'Smith',
            dateOfBirth: '1970-01-01',
            prisonName: 'Moorland',
          },
        },
      })

      return request(app)
        .get(`/court/booking/request/${journeyId()}/prisoner/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Select a date and time for Joe Smith's court hearings")

          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenCalled()
        })
    })

    it('should populate the session with an existing booking for amending', async () => {
      await request(app)
        .get(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual("Change Joe Smith's video link booking")
          expect(existsByLabel($, 'Select the court the hearing is for')).toBe(false)
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            courtCode: 'COURT_CODE',
            bookingId: 1,
            date: startOfTomorrow().toISOString(),
            startTime: '1970-01-01T08:00:00.000Z',
            endTime: '1970-01-01T09:00:00.000Z',
            hearingTypeCode: 'APPEAL',
            locationCode: 'LOCATION_CODE',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
              prisonId: 'MDI',
            },
            cvpRequired: true,
            videoLinkUrl: 'http://example.com',
            comments: 'test',
          }),
        )

      expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
    })

    it('should redirect to to view the booking if the booking is not amendable', async () => {
      videoLinkService.bookingIsAmendable.mockReturnValue(false)

      return request(app)
        .get(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect(302)
        .expect('location', '/court/view-booking/1')
        .then(() => expectJourneySession(app, 'bookACourtHearing', null))
    })
  })

  describe('POST', () => {
    const validForm = {
      courtCode: 'CODE',
      hearingTypeCode: 'APPEAL',
      cvpRequired: 'yes',
      videoLinkUrl: 'https://www.google.co.uk',
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 15, minute: 30 },
      endTime: { hour: 16, minute: 30 },
      preRequired: 'no',
      postRequired: 'no',
    }

    it('should validate an empty form on the court journey', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'courtCode',
              href: '#courtCode',
              text: 'Select a court',
            },
            {
              fieldId: 'hearingTypeCode',
              href: '#hearingTypeCode',
              text: 'Select a hearing type',
            },
            {
              fieldId: 'cvpRequired',
              href: '#cvpRequired',
              text: 'Select if you know the court hearing link',
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

    it('should validate invalid fields', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          videoLinkUrl: 'a'.repeat(121),
          date: '31/02/2022',
          startTime: { hour: 25, minute: 30 },
          endTime: { hour: 25, minute: 30 },
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'videoLinkUrl',
              href: '#videoLinkUrl',
              text: 'Court hearing link must be 120 characters or less',
            },
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
          ])
        })
    })

    it('should validate that the date is on or after today', () => {
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
              text: 'Select an end time that is after the start time',
            },
          ])
        })
    })

    it('should save the posted fields in session', async () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({ ...validForm, preRequired: 'yes', postRequired: 'yes' })
        .expect(302)
        .expect('location', 'video-link-booking/select-rooms')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            courtCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            hearingTypeCode: 'APPEAL',
            postHearingEndTime: '1970-01-01T16:45:00.000Z',
            postHearingStartTime: '1970-01-01T16:30:00.000Z',
            preHearingEndTime: '1970-01-01T15:30:00.000Z',
            preHearingStartTime: '1970-01-01T15:15:00.000Z',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            cvpRequired: true,
            videoLinkUrl: 'https://www.google.co.uk',
          }),
        )
    })

    it('should save the posted fields in session during the amend journey with existing booking data', async () => {
      return request(app)
        .post(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .send(validForm)
        .expect(302)
        .expect('location', 'video-link-booking/select-rooms')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            bookingId: 1,
            courtCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            hearingTypeCode: 'APPEAL',
            locationCode: 'LOCATION_CODE',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            cvpRequired: true,
            videoLinkUrl: 'https://www.google.co.uk',
            comments: 'test',
          }),
        )
    })

    it('should get the prisoner information from the session for the request journey', async () => {
      appSetup({
        bookACourtHearing: {
          prisoner: {
            prisonId: 'MDI',
            firstName: 'Joe',
            lastName: 'Bloggs',
            dateOfBirth: '1970-01-01',
            prisonName: 'Moorland',
          },
        },
      })

      return request(app)
        .post(`/court/booking/request/${journeyId()}/prisoner/video-link-booking`)
        .send(validForm)
        .expect(302)
        .expect('location', 'video-link-booking/check-booking')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            courtCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            hearingTypeCode: 'APPEAL',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Bloggs',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            cvpRequired: true,
            videoLinkUrl: 'https://www.google.co.uk',
          }),
        )
    })
  })
})
