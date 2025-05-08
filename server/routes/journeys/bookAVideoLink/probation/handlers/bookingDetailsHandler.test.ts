import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfTomorrow, startOfYesterday } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import ProbationTeamsService from '../../../../../services/probationTeamsService'
import PrisonerService from '../../../../../services/prisonerService'
import { expectErrorMessages, expectNoErrorMessages } from '../../../../testutils/expectErrorMessage'
import { formatDate } from '../../../../../utils/utils'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { ProbationTeam, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchApi/types'
import ReferenceDataService from '../../../../../services/referenceDataService'
import VideoLinkService from '../../../../../services/videoLinkService'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/probationTeamsService')
jest.mock('../../../../../services/prisonerService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: {
      auditService,
      probationTeamsService,
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
        timeSlot: 'AM',
        prisonLocKey: 'LOCATION_CODE',
      },
    ],
    probationTeamCode: 'PROBATION_CODE',
    probationMeetingType: 'PSR',
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
        .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Enter probation video link booking details for Joe Smith')
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_DETAILS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(referenceDataService.getProbationMeetingTypes).toHaveBeenCalledWith(user)
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

          expect(heading).toEqual('Enter probation video link booking details for Joe Smith')

          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenCalled()
        })
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
      officerFullName: 'John Bing',
      officerEmail: 'jbing@gmail.com',
      officerTelephone: '07892398108',
      meetingTypeCode: 'PSR',
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      duration: '120',
      timePeriods: ['AM'],
    }

    it('should validate an empty form', () => {
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
              fieldId: 'officerDetailsOrUnknown',
              href: '#officerDetailsOrUnknown',
              text: "Enter the probation officer's details",
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
              fieldId: 'duration',
              href: '#duration',
              text: 'Select a meeting duration',
            },
            {
              fieldId: 'timePeriods',
              href: '#timePeriods',
              text: 'Select at least one time period',
            },
          ])
        })
    })

    it('should validate that both `not yet known` and some details can be entered for probation officer details', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          officerDetailsNotKnown: 'true',
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'officerDetailsOrUnknown',
              href: '#officerDetailsOrUnknown',
              text: `Enter either the probation officer's details, or select 'Not yet known'`,
            },
          ])
        })
    })

    it('should validate empty mandatory probation officer details fields', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          officerFullName: '',
          officerEmail: '',
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'officerFullName',
              href: '#officerFullName',
              text: `Enter the probation officer's full name`,
            },
            {
              fieldId: 'officerEmail',
              href: '#officerEmail',
              text: `Enter the probation officer's email address`,
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
          officerEmail: 'invalid email',
          officerTelephone: 'invalid phone',
        })
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'officerEmail',
              href: '#officerEmail',
              text: 'Enter a valid email address',
            },
            {
              fieldId: 'officerTelephone',
              href: '#officerTelephone',
              text: 'Enter a valid UK phone number',
            },
            {
              fieldId: 'date',
              href: '#date',
              text: 'Enter a valid date',
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

    it('should validate that the start and end times are provided on the request journey', () => {
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
        .send({
          ...validForm,
          startTime: undefined,
          endTime: undefined,
        })
        .expect(() => {
          expectErrorMessages([
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
          ])
        })
    })

    it('should save the posted fields in session', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'video-link-booking/availability')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            probationTeamCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            meetingTypeCode: 'PSR',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
            },
            officerDetailsNotKnown: false,
            officer: {
              fullName: 'John Bing',
              email: 'jbing@gmail.com',
              telephone: '07892 398108',
            },
            duration: 120,
            timePeriods: ['AM'],
          }),
        )
    })

    it('should save the posted fields in session without any officer details', () => {
      return request(app)
        .post(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking`)
        .send({
          ...validForm,
          officerDetailsNotKnown: 'true',
          officerFullName: '',
          officerEmail: '',
          officerTelephone: '',
        })
        .expect(302)
        .expect('location', 'video-link-booking/availability')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            probationTeamCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            meetingTypeCode: 'PSR',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
            },
            officerDetailsNotKnown: true,
            duration: 120,
            timePeriods: ['AM'],
          }),
        )
    })

    it('should save the posted fields in session during the amend journey with existing booking data', () => {
      return request(app)
        .post(`/probation/booking/amend/1/${journeyId()}/video-link-booking`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'video-link-booking/availability')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            bookingId: 1,
            probationTeamCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            meetingTypeCode: 'PSR',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Smith',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
              prisonerNumber: 'A1234AA',
            },
            officerDetailsNotKnown: false,
            officer: {
              fullName: 'John Bing',
              email: 'jbing@gmail.com',
              telephone: '07892 398108',
            },
            duration: 120,
            timePeriods: ['AM'],
            locationCode: 'LOCATION_CODE',
            startTime: '1970-01-01T08:00:00.000Z',
            endTime: '1970-01-01T09:00:00.000Z',
            comments: 'test',
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
        .send({
          ...validForm,
          duration: undefined,
          timePeriods: undefined,
          startTime: { hour: 15, minute: 30 },
          endTime: { hour: 16, minute: 30 },
        })
        .expect(() => expectNoErrorMessages())
        .expect(302)
        .expect('location', 'video-link-booking/check-booking')
        .expect(() => {
          expect(prisonerService.getPrisonerByPrisonerNumber).not.toHaveBeenLastCalledWith('A1234AA', user)
        })
        .then(() =>
          expectJourneySession(app, 'bookAProbationMeeting', {
            probationTeamCode: 'CODE',
            date: startOfTomorrow().toISOString(),
            meetingTypeCode: 'PSR',
            prisoner: {
              firstName: 'Joe',
              lastName: 'Bloggs',
              dateOfBirth: '1970-01-01',
              prisonId: 'MDI',
              prisonName: 'Moorland',
            },
            officerDetailsNotKnown: false,
            officer: {
              fullName: 'John Bing',
              email: 'jbing@gmail.com',
              telephone: '07892 398108',
            },
            startTime: '1970-01-01T15:30:00.000Z',
            endTime: '1970-01-01T16:30:00.000Z',
          }),
        )
    })
  })
})
