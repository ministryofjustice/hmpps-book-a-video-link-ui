import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { existsByKey, getByDataQa, getPageHeader, getValueByKey } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'
import PrisonService from '../../../../services/prisonService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/videoLinkService')
jest.mock('../../../../services/prisonerService')
jest.mock('../../../../services/prisonService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const videoLinkService = new VideoLinkService(null) as jest.Mocked<VideoLinkService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const prisonService = new PrisonService(null) as jest.Mocked<PrisonService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService, prisonerService, prisonService },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])('%s journey - should render the correct view page', (_: string, journey: string) => {
    auditService.logPageView.mockResolvedValue(null)
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
      .get(`/booking/${journey}/create/${journeyId()}/ABC123/add-video-link-booking/confirmation/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
        expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
        expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('AA1234A', user)
        expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('The video link has been booked')
        expect(bookAnotherLink).toEqual(`/booking/${journey}/create/prisoner-search`)

        expect(getValueByKey($, 'Name')).toEqual('Joe Bloggs (AA1234A)')

        expect(existsByKey($, 'Court')).toBe(journey === 'court')
        expect(existsByKey($, 'Hearing type')).toBe(journey === 'court')
        expect(existsByKey($, 'Prison room for court hearing')).toBe(journey === 'court')
        expect(existsByKey($, 'Hearing start time')).toBe(journey === 'court')
        expect(existsByKey($, 'Hearing end time')).toBe(journey === 'court')
        expect(existsByKey($, 'Prison room for pre-court hearing')).toBe(journey === 'court')
        expect(existsByKey($, 'Pre-hearing start time')).toBe(journey === 'court')
        expect(existsByKey($, 'Pre-hearing end time')).toBe(journey === 'court')
        expect(existsByKey($, 'Prison room for post-court hearing')).toBe(journey === 'court')
        expect(existsByKey($, 'Post-hearing start time')).toBe(journey === 'court')
        expect(existsByKey($, 'Post-hearing end time')).toBe(journey === 'court')

        expect(existsByKey($, 'Probation team')).toBe(journey === 'probation')
        expect(existsByKey($, 'Meeting type')).toBe(journey === 'probation')
        expect(existsByKey($, 'Prison room for probation meeting')).toBe(journey === 'probation')
        expect(existsByKey($, 'Meeting start time')).toBe(journey === 'probation')
        expect(existsByKey($, 'Meeting end time')).toBe(journey === 'probation')
      })
  })
})

const getCourtBooking = prisonerNumber => ({
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

const getProbationBooking = prisonerNumber => ({
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
