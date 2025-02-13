import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfToday, startOfTomorrow, startOfYesterday } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { dropdownOptions, existsByLabel, getPageHeader, getValueByKey } from '../../../../testutils/cheerio'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import PrisonService from '../../../../../services/prisonService'
import PrisonerService from '../../../../../services/prisonerService'
import VideoLinkService from '../../../../../services/videoLinkService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import { formatDate } from '../../../../../utils/utils'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { Location, ProbationTeam, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/probationTeamsService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/prisonerService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: {
      auditService,
      probationTeamsService,
      prisonService,
      prisonerService,
      referenceDataService,
      videoLinkService,
    },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup()

  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ] as ProbationTeam[])

  prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
    prisonId: 'MDI',
    firstName: 'Joe',
    lastName: 'Smith',
    dateOfBirth: '1970-01-01',
    prisonName: 'Moorland',
    prisonerNumber: 'A1234AA',
  } as Prisoner)

  videoLinkService.getVideoLinkBookingById.mockResolvedValue({
    bookingType: 'PROBATION',
    prisonAppointments: [
      {
        prisonerNumber: 'A1234AA',
        appointmentType: 'VLB_PROBATION',
        appointmentDate: formatDate(startOfTomorrow(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '09:00',
        prisonLocKey: 'LOCATION_CODE',
      },
    ],
    probationTeamCode: 'PROBATION_CODE',
    probationMeetingType: 'PSR',
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
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(referenceDataService.getProbationMeetingTypes).toHaveBeenCalledWith(user)
          expect(existsByLabel($, 'Which probation team is the meeting for?')).toBe(true)
          expect(existsByLabel($, 'Which type of meeting is this?')).toBe(true)
        })
    })

    it('should get the prisoner information from the session for the request journey', () => {
      appSetup({
        bookAProbationMeeting: {
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
        .get(`/probation/booking/request/${journeyId()}/prisoner/video-link-booking`)
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
        .get(`/probation/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          // The dropdown contains the non-video location since it is on the booking being amended
          expect(dropdownOptions($, 'location')).toEqual(['VIDE', 'LOCATION_CODE'])

          expect(heading).toEqual('Change video link booking')
          expect(existsByLabel($, 'Which probation team is the meeting for?')).toBe(false)
          expect(existsByLabel($, 'Which type of meeting is this?')).toBe(true)
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            probationTeamCode: 'PROBATION_CODE',
            bookingId: 1,
            date: startOfTomorrow().toISOString(),
            startTime: '1970-01-01T08:00:00.000Z',
            endTime: '1970-01-01T09:00:00.000Z',
            meetingTypeCode: 'PSR',
            locationCode: 'LOCATION_CODE',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
              prisonId: 'MDI',
            },
            comments: 'test',
          }),
        )

      expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
    })

    it('should redirect to to view the booking if the booking is not amendable', async () => {
      videoLinkService.bookingIsAmendable.mockReturnValue(false)

      return request(app)
        .get(`/probation/booking/amend/1/${journeyId()}/video-link-booking`)
        .expect(302)
        .expect('location', '/probation/view-booking/1')
        .then(() => expectJourneySession(app, 'bookAProbationMeeting', null))
    })
  })

  describe('POST', () => {
    const validForm = {
      probationTeamCode: 'CODE',
      meetingTypeCode: 'PSR',
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 15, minute: 30 },
      endTime: { hour: 16, minute: 30 },
      location: 'VIDE',
    }

    it('should validate an empty form on the probation journey', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'probationTeamCode',
              href: '#probationTeamCode',
              text: 'Select a probation team',
            },
            {
              fieldId: 'meetingTypeCode',
              href: '#meetingTypeCode',
              text: 'Select a meeting type',
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
              text: 'Select a prison room for the probation meeting',
            },
          ])
        })
    })

    it('should validate invalid fields', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          date: '31/02/2022',
          startTime: { hour: 25, minute: 30 },
          endTime: { hour: 25, minute: 30 },
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
          ])
        })
    })

    it('should validate that the date is on or after today', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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

    it('should validate that the start time is in the future', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
              text: 'Enter a time which is in the future',
            },
          ])
        })
    })

    it('should validate that the start time is before the end time', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
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
        .post(`/probation/booking/amend/1/${journeyId()}/video-link-booking`)
        .send({
          ...validForm,
          date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
          startTime: { hour: 8, minute: 0 },
          endTime: { hour: 10, minute: 0 },
          location: 'LOCATION_CODE',
        })
        .expect(() =>
          expectErrorMessages([
            {
              fieldId: 'location',
              href: '#location',
              text: 'You cannot change the time for this room. Select another room or contact the prison.',
            },
          ]),
        )

      expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
      expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', true, user)
    })

    it('should validate that non-video room is allowed if schedule is unchanged during amend', () => {
      return request(app)
        .post(`/probation/booking/amend/1/${journeyId()}/video-link-booking`)
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
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'video-link-booking/check-booking')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            probationTeamCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            meetingTypeCode: 'PSR',
            locationCode: 'VIDE',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Bloggs',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
            },
            startTime: '1970-01-01T15:30:00.000Z',
          }),
        )
    })

    it('should get the prisoner information from the session for the request journey', () => {
      appSetup({
        bookAProbationMeeting: {
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
        .post(`/probation/booking/request/${journeyId()}/prisoner/video-link-booking`)
        .send({ ...validForm })
        .expect(302)
        .expect('location', 'video-link-booking/check-booking')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            probationTeamCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            endTime: '1970-01-01T16:30:00.000Z',
            meetingTypeCode: 'PSR',
            locationCode: 'VIDE',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Bloggs',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
            },
            startTime: '1970-01-01T15:30:00.000Z',
          }),
        )
    })
  })
})
