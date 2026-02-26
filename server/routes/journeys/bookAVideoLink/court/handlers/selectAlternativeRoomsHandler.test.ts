import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader, radioOptions } from '../../../../testutils/cheerio'
import { expectErrorMessages } from '../../../../testutils/expectErrorMessage'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { AvailableLocationsResponse } from '../../../../../@types/bookAVideoLinkApi/types'
import CourtBookingService from '../../../../../services/courtBookingService'
import { BookACourtHearingJourney } from '../journey'
import config from '../../../../../config'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/courtBookingService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: {
      auditService,
      courtBookingService,
    },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

const bookACourtHearingSession = {
  prisoner: {
    prisonId: 'MDI',
    prisonerNumber: 'ABC123',
    prisonName: 'Moorland',
  },
  date: '2022-03-20T00:00:00Z',
  locationCode: 'LOCATION',
  startTime: '1970-01-01T13:30:00Z',
  endTime: '1970-01-01T14:30:00Z',
  courtCode: 'COURT_HOUSE',
  hearingTypeCode: 'APPEAL',
  notesForStaff: 'staff notes',
  videoLinkUrl: 'videoLinkUrl',
} as BookACourtHearingJourney

beforeEach(() => {
  config.featureToggles.selectAlternativeRooms = true

  appSetup({ bookACourtHearing: bookACourtHearingSession })

  courtBookingService.getAvailableLocations.mockResolvedValue({
    locations: [
      {
        name: 'Video room 1',
        startTime: '10:00',
        endTime: '12:00',
        dpsLocationKey: 'VIDEO_1',
        timeSlot: 'AM',
      },
      {
        name: 'Video room 2',
        startTime: '11:00',
        endTime: '13:00',
        dpsLocationKey: 'VIDEO_2',
        timeSlot: 'AM',
      },
    ],
  } as AvailableLocationsResponse)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Booking availability handler', () => {
  describe('GET', () => {
    it('should render the correct view page', () => {
      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-alternative-rooms`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const radios = radioOptions($, 'option')

          expect(heading).toEqual('No bookings available for your selected time')

          expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ALTERNATIVE_ROOMS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          expect(courtBookingService.getAvailableLocations).toHaveBeenCalled()
          expect(radios).toEqual(['10:00///12:00///VIDEO_1///AM', '11:00///13:00///VIDEO_2///AM'])
        })
    })

    it('should offer alternative suggestions if the requested slot is not available', () => {
      courtBookingService.getAvailableLocations.mockResolvedValue({
        locations: [
          {
            name: 'Video room 1',
            startTime: '13:00',
            endTime: '14:00',
            dpsLocationKey: 'VIDEO_1',
            timeSlot: 'PM',
          },
          {
            name: 'Video room 2',
            startTime: '15:00',
            endTime: '16:00',
            dpsLocationKey: 'VIDEO_2',
            timeSlot: 'PM',
          },
        ],
      } as AvailableLocationsResponse)

      return request(app)
        .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-alternative-rooms`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)
          const radios = radioOptions($, 'option')

          expect(heading).toEqual('No bookings available for your selected time')
          expect(courtBookingService.getAvailableLocations).toHaveBeenCalled()
          expect(radios).toEqual(['13:00///14:00///VIDEO_1///PM', '15:00///16:00///VIDEO_2///PM'])
        })
    })
  })

  describe('POST', () => {
    const validForm = {
      option: '15:00///16:00///VIDEO_2///PM',
    }

    it('should validate an empty form', () => {
      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-alternative-rooms`)
        .send({})
        .expect(() => {
          expectErrorMessages([
            {
              fieldId: 'option',
              href: '#option',
              text: 'Select a suitable booking',
            },
          ])
        })
    })

    it('should save the posted fields in session with pre and post-hearing', () => {
      bookACourtHearingSession.preHearingStartTime = '1970-01-01T13:15:00Z'
      bookACourtHearingSession.preHearingEndTime = '1970-01-01T13:30:00Z'
      bookACourtHearingSession.postHearingStartTime = '1970-01-01T14:30:00Z'
      bookACourtHearingSession.postHearingEndTime = '1970-01-01T14:45:00Z'

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-alternative-rooms`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            ...bookACourtHearingSession,
            preHearingStartTime: '1970-01-01T15:00:00.000Z',
            preHearingEndTime: '1970-01-01T15:15:00.000Z',
            preLocationCode: 'VIDEO_2',
            startTime: '1970-01-01T15:15:00.000Z',
            endTime: '1970-01-01T15:45:00.000Z',
            postHearingStartTime: '1970-01-01T15:45:00.000Z',
            postHearingEndTime: '1970-01-01T16:00:00.000Z',
            postLocationCode: 'VIDEO_2',
            locationCode: 'VIDEO_2',
          }),
        )
    })

    it('should save the posted fields in session with post but no pre-hearing', () => {
      bookACourtHearingSession.preHearingStartTime = undefined
      bookACourtHearingSession.preHearingEndTime = undefined
      bookACourtHearingSession.postHearingStartTime = '1970-01-01T14:30:00Z'
      bookACourtHearingSession.postHearingEndTime = '1970-01-01T14:45:00Z'

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-alternative-rooms`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            ...bookACourtHearingSession,
            startTime: '1970-01-01T15:00:00.000Z',
            endTime: '1970-01-01T15:45:00.000Z',
            locationCode: 'VIDEO_2',
            postHearingStartTime: '1970-01-01T15:45:00.000Z',
            postHearingEndTime: '1970-01-01T16:00:00.000Z',
            postLocationCode: 'VIDEO_2',
          }),
        )
    })

    it('should save the posted fields in session with pre but no post hearing', () => {
      bookACourtHearingSession.preHearingStartTime = '1970-01-01T13:15:00Z'
      bookACourtHearingSession.preHearingEndTime = '1970-01-01T13:30:00Z'
      bookACourtHearingSession.postHearingStartTime = undefined
      bookACourtHearingSession.postHearingEndTime = undefined

      return request(app)
        .post(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/select-alternative-rooms`)
        .send({
          ...validForm,
        })
        .expect(302)
        .expect('location', 'check-booking')
        .then(() =>
          expectJourneySession(app, 'bookACourtHearing', {
            ...bookACourtHearingSession,
            preHearingStartTime: '1970-01-01T15:00:00.000Z',
            preHearingEndTime: '1970-01-01T15:15:00.000Z',
            preLocationCode: 'VIDEO_2',
            startTime: '1970-01-01T15:15:00.000Z',
            endTime: '1970-01-01T16:00:00.000Z',
            locationCode: 'VIDEO_2',
          }),
        )
    })
  })
})
