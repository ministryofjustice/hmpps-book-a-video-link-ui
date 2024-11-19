import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'
import expectJourneySession from '../../../testutils/testUtilRoute'
import { VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchApi/types'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/videoLinkService')
jest.mock('../../../../services/prisonerService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService, prisonerService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup()

  videoLinkService.getVideoLinkBookingById.mockResolvedValue({
    prisonAppointments: [
      {
        prisonerNumber: 'A1234AA',
        appointmentType: 'VLB_PROBATION',
        prisonLocKey: 'VCC-ROOM-1',
        appointmentDate: '2024-04-05',
        startTime: '11:30',
        endTime: '12:30',
      },
    ],
  } as VideoLinkBooking)

  prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
    firstName: 'Joe',
    lastName: 'Bloggs',
    prisonId: 'MDI',
    prisonerNumber: 'A1234AA',
  } as Prisoner)

  videoLinkService.bookingIsAmendable.mockReturnValue(true)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct view page', () => {
    return request(app)
      .get(`/court/booking/cancel/1/${journeyId()}/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_CANCELLED_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
        expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
        expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('A1234AA', user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('This video link booking has been cancelled')
        expect(bookAnotherLink).toEqual(`/court/booking/create/A1234AA/video-link-booking`)
      })
      .then(() => expectJourneySession(app, 'bookAVideoLink', null))
  })
})
