import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfToday, startOfTomorrow, startOfYesterday } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import {
  dropdownOptions,
  existsByLabel,
  existsByName,
  getPageHeader,
  getValueByKey,
} from '../../../../testutils/cheerio'
import CourtsService from '../../../../../services/courtsService'
import PrisonService from '../../../../../services/prisonService'
import PrisonerService from '../../../../../services/prisonerService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import { formatDate } from '../../../../../utils/utils'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { Court, Location, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
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

  prisonService.getAppointmentLocations.mockImplementation((_, videoLinkOnly) => {
    if (videoLinkOnly) {
      return Promise.resolve([{ key: 'VIDE', description: 'Video location', enabled: true } as Location])
    }
    return Promise.resolve([
      { key: 'VIDE', description: 'Video location', enabled: true } as Location,
      { key: 'LOCATION_CODE', description: 'Kitchen', enabled: true } as Location,
    ])
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('New Booking handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Enter video link booking details')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(dropdownOptions($, 'location')).toEqual(['VIDE'])

          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(referenceDataService.getCourtHearingTypes).toHaveBeenCalledWith(user)
          expect(existsByName($, 'preRequired')).toBe(true)
          expect(existsByName($, 'postRequired')).toBe(true)
          expect(existsByLabel($, 'Which court is the hearing for?')).toBe(true)
          expect(existsByLabel($, 'Which type of hearing is this?')).toBe(true)
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

          expect(heading).toEqual('Enter video link booking details')

          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenCalled()
          expect(getValueByKey($, 'Name')).toEqual('Joe Smith')
          expect(getValueByKey($, 'Date of birth')).toEqual('1 January 1970')
        })
    })

    it('should populate the session with an existing booking for amending', async () => {
      await request(app)
        .get(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          // The dropdown contains the non-video location since it is on the booking being amended
          expect(dropdownOptions($, 'location')).toEqual(['VIDE', 'LOCATION_CODE'])

          expect(heading).toEqual('Change video link booking')
          expect(existsByLabel($, 'Which court is the hearing for?')).toBe(false)
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            type: 'COURT',
            agencyCode: 'COURT_CODE',
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
      agencyCode: 'CODE',
      hearingTypeCode: 'APPEAL',
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 15, minute: 30 },
      endTime: { hour: 16, minute: 30 },
      location: 'VIDE',
      preRequired: 'no',
      postRequired: 'no',
      cvpRequired: 'yes',
      videoLinkUrl: 'https://www.google.co.uk',
    }

    it('should validate an empty form on the court journey', () => {
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
            {
              fieldId: 'cvpRequired',
              href: '#cvpRequired',
              text: 'Select if you know the court hearing link',
            },
          ])
        })
    })

    it('should validate that the pre and post location items are filled', () => {
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
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          date: '31/02/2022',
          startTime: { hour: 25, minute: 30 },
          endTime: { hour: 25, minute: 30 },
          videoLinkUrl: 'a'.repeat(121),
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
              text: 'Court hearing link must be 120 characters or less',
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
              text: 'Select a end time that is after the start time',
            },
          ])
        })
    })

    it('should validate that booking schedule is not changed during amend if the selected room is a non-video room', async () => {
      await request(app)
        .post(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .send({
          ...validForm,
          date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
          startTime: { hour: 8, minute: 0 },
          endTime: { hour: 10, minute: 0 },
          location: 'LOCATION_CODE',
          preRequired: 'yes',
          preLocation: 'LOCATION_CODE',
          postRequired: 'yes',
          postLocation: 'LOCATION_CODE',
        })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'preLocation',
              href: '#preLocation',
              text: 'You cannot change the time for this room. Select another room or contact the prison.',
            },
            {
              fieldId: 'location',
              href: '#location',
              text: 'You cannot change the time for this room. Select another room or contact the prison.',
            },
            {
              fieldId: 'postLocation',
              href: '#postLocation',
              text: 'You cannot change the time for this room. Select another room or contact the prison.',
            },
          ]),
        )

      expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', true, user)
    })

    it('should validate that non-video room is allowed if schedule is unchanged during amend', () => {
      return request(app)
        .post(`/court/booking/amend/1/${journeyId()}/video-link-booking`)
        .send({
          ...validForm,
          date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
          startTime: { hour: 8, minute: 0 },
          endTime: { hour: 9, minute: 0 },
          location: 'LOCATION_CODE',
        })
        .expect(() => expectNoErrorMessages())
    })

    it('should save the posted fields in session', () => {
      prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
        prisonId: 'MDI',
        prisonName: 'Moorland',
        prisonerNumber: 'A1234AA',
        firstName: 'Joe',
        lastName: 'Bloggs',
        dateOfBirth: '1970-01-01',
      } as Prisoner)

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
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            agencyCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            hearingTypeCode: 'APPEAL',
            locationCode: 'VIDE',
            postHearingEndTime: '1970-01-01T16:45:00.000Z',
            postHearingStartTime: '1970-01-01T16:30:00.000Z',
            postLocationCode: 'POST_LOCATION',
            preHearingEndTime: '1970-01-01T15:30:00.000Z',
            preHearingStartTime: '1970-01-01T15:15:00.000Z',
            preLocationCode: 'PRE_LOCATION',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Bloggs',
              dateOfBirth: '1970-01-01',
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

    it('should get the prisoner information from the session for the request journey', () => {
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
        .send({ ...validForm })
        .expect(302)
        .expect('location', 'video-link-booking/check-booking')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            agencyCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            hearingTypeCode: 'APPEAL',
            locationCode: 'VIDE',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Bloggs',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            type: 'COURT',
            videoLinkUrl: 'https://www.google.co.uk',
          }),
        )
    })
  })
})
