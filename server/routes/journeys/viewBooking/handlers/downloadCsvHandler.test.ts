import type { Express } from 'express'
import request from 'supertest'
import { startOfDay, formatDate } from 'date-fns'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import VideoLinkService from '../../../../services/videoLinkService'
import { Court, ProbationTeam, ScheduleItem } from '../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../config'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/courtsService')
jest.mock('../../../../services/probationTeamsService')
jest.mock('../../../../services/videoLinkService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const courtsService = new CourtsService(null) as jest.Mocked<CourtsService>
const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>
const videoLinkService = new VideoLinkService(null, null) as jest.Mocked<VideoLinkService>

let app: Express

const appSetup = (journeySession = {}) => {
  app = appWithAllRoutes({
    services: { auditService, videoLinkService },
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

  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ] as ProbationTeam[])

  config.defaultCourtVideoUrl = 'meet.video.justice.gov.uk'
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should download court csv for today', () => {
    const expectedCsv =
      'Appointment Start Time,Appointment End Time,Prison,Prisoner Name,Prisoner Number,Appointment Type,Hearing Type,Court Hearing Link,Room Hearing Link\n12:45,13:15,HMP Moorland,John Doe,A1234AA,Court hearing,Appeal hearing,https://court.link.url,'

    videoLinkService.getVideoLinkSchedule.mockResolvedValue([getCourtBooking()])

    return request(app)
      .get('/court/view-booking/download-csv')
      .expect('Content-Type', /text\/csv; charset=utf-8/)
      .expect(
        'Content-Disposition',
        `attachment; filename="VideoLinkBookings-${formatDate(new Date(), 'yyyy-MM-dd')}-Court_1.csv"`,
      )
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.DOWNLOAD_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        expect(res.text).toEqual(expectedCsv)

        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenLastCalledWith(
          'court',
          'C1',
          startOfDay(new Date()),
          user,
        )
      })
  })

  it('should download sorted court csv for today', () => {
    const expectedCsv =
      'Appointment Start Time,Appointment End Time,Prison,Prisoner Name,Prisoner Number,Appointment Type,Hearing Type,Court Hearing Link,Room Hearing Link\n' +
      '8:45,9:00,HMP Moorland,Jane,P2,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:00,9:30,HMP Moorland,Jane,P2,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:30,9:45,HMP Moorland,Jane,P2,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '8:45,9:00,HMP Moorland,Jenny,P3,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:00,9:30,HMP Moorland,Jenny,P3,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:30,9:45,HMP Moorland,Jenny,P3,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '8:45,9:00,HMP Moorland,John,P1,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:00,9:30,HMP Moorland,John,P1,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:30,9:45,HMP Moorland,John,P1,Court hearing,Appeal hearing,https://court.link.url,\n' +
      '9:45,10:00,HMP Moorland,Jane,P2,Court hearing,Appeal hearing,HMCTS45643@meet.video.justice.gov.uk,\n' +
      '10:00,10:45,HMP Moorland,Jane,P2,Court hearing,Appeal hearing,HMCTS54321@meet.video.justice.gov.uk,'

    videoLinkService.getVideoLinkSchedule.mockResolvedValue([
      getCourtBooking(1, '8:45', '9:00', 'john', 'P1'),
      getCourtBooking(1, '9:00', '9:30', 'john', 'P1'),
      getCourtBooking(1, '9:30', '9:45', 'john', 'P1'),
      getCourtBooking(2, '8:45', '9:00', 'jane', 'P2'),
      getCourtBooking(2, '9:00', '9:30', 'jane', 'P2'),
      getCourtBooking(2, '9:30', '9:45', 'jane', 'P2'),
      getCourtBooking(3, '8:45', '9:00', 'jenny', 'P3'),
      getCourtBooking(3, '9:00', '9:30', 'jenny', 'P3'),
      getCourtBooking(3, '9:30', '9:45', 'jenny', 'P3'),
      getCourtBooking(4, '9:45', '10:00', 'jane', 'P2', '45643'),
      getCourtBooking(4, '10:00', '10:45', 'jane', 'P2', '54321'),
    ])

    return request(app)
      .get('/court/view-booking/download-csv')
      .expect('Content-Type', /text\/csv; charset=utf-8/)
      .expect(
        'Content-Disposition',
        `attachment; filename="VideoLinkBookings-${formatDate(new Date(), 'yyyy-MM-dd')}-Court_1.csv"`,
      )
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.DOWNLOAD_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        expect(res.text).toEqual(expectedCsv)

        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenLastCalledWith(
          'court',
          'C1',
          startOfDay(new Date()),
          user,
        )
      })
  })

  it('should download probation team csv for today', () => {
    const expectedCsv =
      'Appointment Start Time,Appointment End Time,Prison,Prisoner Name,Prisoner Number,Meeting Type,Room Hearing Link,Probation Officer Name,Email Address\n12:45,13:15,HMP Moorland,Jane Doe,A1234AA,Pre sentence report,https://room.link.url,Jane Doe,jane.doe@email.com'

    videoLinkService.getVideoLinkSchedule.mockResolvedValue([getProbationTeamBooking()])

    return request(app)
      .get('/probation/view-booking/download-csv')
      .expect('Content-Type', /text\/csv; charset=utf-8/)
      .expect(
        'Content-Disposition',
        `attachment; filename="VideoLinkBookings-${formatDate(new Date(), 'yyyy-MM-dd')}-Probation_1.csv"`,
      )
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.DOWNLOAD_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        expect(res.text).toEqual(expectedCsv)

        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenLastCalledWith(
          'probation',
          'P1',
          startOfDay(new Date()),
          user,
        )
      })
  })
})

const getCourtBooking = (
  bookingId: number = 1,
  start: string = '12:45',
  end: string = '13:15',
  name: string = 'john doe',
  prisNumber: string = 'A1234AA',
  hmctsNumber: string = undefined,
): ScheduleItem & { prisonerName: string; prisonLocationDescription: string } => {
  const videoUrl = hmctsNumber ? undefined : 'https://court.link.url'

  return {
    videoBookingId: bookingId,
    prisonAppointmentId: bookingId,
    bookingType: 'COURT',
    statusCode: 'ACTIVE',
    videoUrl,
    createdByPrison: 'false',
    courtId: 1,
    courtCode: 'C1',
    courtDescription: 'Court 1',
    hearingType: 'APPEAL',
    hearingTypeDescription: 'Appeal hearing',
    prisonCode: 'MDI',
    prisonName: 'HMP Moorland',
    prisonerNumber: prisNumber,
    appointmentType: 'VLB_COURT_MAIN',
    appointmentTypeDescription: 'Court - main hearing',
    prisonLocKey: 'MDI-VCC-1',
    prisonLocDesc: 'VCC-crown-conference-room-1',
    dpsLocationId: 'a4fe3fef-34fd-4354fde-a12efe',
    appointmentDate: '2024-10-03',
    startTime: start,
    endTime: end,
    createdTime: '2024-10-01 14:45',
    createdBy: 'creator@email.com',
    prisonerName: name,
    prisonLocationDescription: 'Location description',
    hmctsNumber,
    checkAvailability: false,
  }
}

const getProbationTeamBooking = (): ScheduleItem & { prisonerName: string; prisonLocationDescription: string } => ({
  videoBookingId: 2,
  prisonAppointmentId: 2,
  bookingType: 'PROBATION',
  statusCode: 'ACTIVE',
  videoUrl: 'https://room.link.url',
  createdByPrison: 'false',
  probationTeamId: 1,
  probationTeamCode: 'P1',
  probationTeamDescription: 'Probation 1',
  probationMeetingType: 'PSR',
  probationMeetingTypeDescription: 'Pre sentence report',
  prisonCode: 'MDI',
  prisonName: 'HMP Moorland',
  prisonerNumber: 'A1234AA',
  appointmentType: 'VLB_PROBATION',
  appointmentTypeDescription: 'Probation meeting',
  prisonLocKey: 'MDI-VCC-1',
  prisonLocDesc: 'VCC-crown-conference-room-1',
  dpsLocationId: 'a4fe3fef-34fd-4354fde-a12efe',
  appointmentDate: '2024-10-03',
  startTime: '12:45',
  endTime: '13:15',
  createdTime: '2024-10-01 14:45',
  createdBy: 'creator@email.com',
  prisonerName: 'jane doe',
  prisonLocationDescription: 'Location description',
  probationOfficerName: 'Jane Doe',
  probationOfficerEmailAddress: 'jane.doe@email.com',
  checkAvailability: false,
})
