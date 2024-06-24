import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'

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
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct view page', () => {
    videoLinkService.getVideoLinkBookingById.mockResolvedValue({
      prisonAppointments: [
        {
          prisonerNumber: 'ABC123',
          appointmentType: 'VLB_PROBATION',
          prisonLocKey: 'VCC-ROOM-1',
          appointmentDate: '2024-04-05',
          startTime: '11:30',
          endTime: '12:30',
        },
      ],
    })

    prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
      firstName: 'Joe',
      lastName: 'Bloggs',
      prisonId: 'MDI',
      prisonerNumber: 'ABC123',
    })

    return request(app)
      .get(`/court/booking/remove/1/${journeyId()}/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_CANCELLED_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
        expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
        expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('ABC123', user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('This video link booking has been cancelled')
        expect(bookAnotherLink).toEqual(`/court/booking/create/ABC123/add-video-link-booking`)
      })
  })
})
