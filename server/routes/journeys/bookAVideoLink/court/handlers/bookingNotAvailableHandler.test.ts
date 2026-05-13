import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { parse } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getPageHeader } from '../../../../testutils/cheerio'
import CourtsService from '../../../../../services/courtsService'
import { Court } from '../../../../../@types/bookAVideoLinkApi/types'
import TelemetryService from '../../../../../services/telemetryService'
import config from '../../../../../config'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/courtsService')
jest.mock('../../../../../services/telemetryService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const telemetryService = new TelemetryService(null) as jest.Mocked<TelemetryService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, courtsService, telemetryService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup({
    bookACourtHearing: {
      prisoner: {
        prisonId: 'MDI',
      },
      preHearingStartTime: parse('12:45', 'HH:mm', new Date(0)).toISOString(),
      preHearingEndTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
      startTime: parse('13:00', 'HH:mm', new Date(0)).toISOString(),
      endTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
      postHearingStartTime: parse('14:00', 'HH:mm', new Date(0)).toISOString(),
      postHearingEndTime: parse('14:15', 'HH:mm', new Date(0)).toISOString(),
    },
  })

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct view page when alternative room feature off', () => {
    config.featureToggles.selectAlternativeRooms = false

    return request(app)
      .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_NOT_AVAILABLE_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(telemetryService.trackEvent).toHaveBeenCalled()
        expect(heading).toEqual('No bookings available for your selected time')
      })
  })

  it('should render the correct view page when alternative room feature on', () => {
    config.featureToggles.selectAlternativeRooms = true
    config.featureToggles.notAlternativeCourtRoomPrisons = ''

    return request(app)
      .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_NOT_AVAILABLE_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(telemetryService.trackEvent).toHaveBeenCalled()
        expect(heading).toEqual('No bookings available for your selected date')
      })
  })

  it('should render the correct view page when alternative room feature on but prison is excluded from feature', () => {
    config.featureToggles.selectAlternativeRooms = true
    config.featureToggles.notAlternativeCourtRoomPrisons = 'MDI'

    return request(app)
      .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/not-available`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_NOT_AVAILABLE_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(telemetryService.trackEvent).toHaveBeenCalled()
        expect(heading).toEqual('No bookings available for your selected time')
      })
  })
})
