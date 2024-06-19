import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'
import PrisonService from '../../../../services/prisonService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/videoLinkService')
jest.mock('../../../../services/prisonerService')
jest.mock('../../../../services/prisonService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService, prisonerService, prisonService },
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
  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])('%s journey - should render the correct view page', (_: string, journey: string) => {
    videoLinkService.getVideoLinkBookingById.mockResolvedValue(
      journey === 'court' ? getCourtBooking('AA1234A') : getProbationBooking('AA1234A'),
    )
    prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
      firstName: 'Joe',
      lastName: 'Bloggs',
      prisonId: 'MDI',
      prisonerNumber: 'AA1234A',
    })
    prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }])

    return request(app)
      .get(`/${journey}/view-booking/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_BOOKING_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
        expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
        expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('AA1234A', user)
        expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'change-link').attr('href')

        expect(heading).toEqual('Joe Bloggs’s video link details')
        expect(bookAnotherLink).toEqual(`/${journey}/booking/edit/1001/add-video-link-booking`)
      })
  })

  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])('%s journey - should throw 404 if requested booking does not match journey type', (_: string, journey: string) => {
    videoLinkService.getVideoLinkBookingById.mockResolvedValue(
      journey === 'court' ? getProbationBooking('AA1234A') : getCourtBooking('AA1234A'),
    )

    return request(app)
      .get(`/${journey}/view-booking/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.status).toEqual(404)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        expect(heading).toEqual('Page not found')
      })
  })
})

const getCourtBooking = (prisonerNumber: string) => ({
  videoLinkBookingId: 1001,
  bookingType: 'COURT',
  prisonAppointments: [
    {
      prisonerNumber,
      appointmentType: 'VLB_COURT_PRE',
      prisonLocKey: 'VCC-ROOM-1',
      appointmentDate: '2024-04-05',
      startTime: '11:15',
      endTime: '11:30',
    },
    {
      prisonerNumber,
      appointmentType: 'VLB_COURT_MAIN',
      prisonLocKey: 'VCC-ROOM-1',
      appointmentDate: '2024-04-05',
      startTime: '11:30',
      endTime: '12:30',
    },
    {
      prisonerNumber,
      appointmentType: 'VLB_COURT_POST',
      prisonLocKey: 'VCC-ROOM-1',
      appointmentDate: '2024-04-05',
      startTime: '12:30',
      endTime: '12:45',
    },
  ],
  courtDescription: 'Derby Justice Centre',
  courtHearingTypeDescription: 'Appeal hearing',
  videoLinkUrl: 'https://video.here.com',
})

const getProbationBooking = (prisonerNumber: string) => ({
  videoLinkBookingId: 1001,
  bookingType: 'PROBATION',
  prisonAppointments: [
    {
      prisonerNumber,
      appointmentType: 'VLB_PROBATION',
      prisonLocKey: 'VCC-ROOM-1',
      appointmentDate: '2024-04-05',
      startTime: '11:30',
      endTime: '12:30',
    },
  ],
  probationTeamDescription: 'Barnet PPOC',
  probationMeetingTypeDescription: 'Pre-sentence report',
  videoLinkUrl: 'https://video.here.com',
})
