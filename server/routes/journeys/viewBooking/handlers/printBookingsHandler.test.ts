import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { formatDate, startOfToday } from 'date-fns'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { Court, ProbationTeam, ScheduleItem } from '../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../config'
import { UnpaginatedBookingsRequest } from '../../../../data/bookAVideoLinkApiClient'

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
    services: { auditService, courtsService, probationTeamsService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  config.featureToggles.viewMultipleAgenciesBookings = true
  appSetup()

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ] as Court[])
  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ] as ProbationTeam[])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])('%s journey - should render the default view page sorted by date and time', (_: string, journey: string) => {
    if (journey === 'court') {
      videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(videoLinkCourtSchedule)
    } else {
      videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(videoLinkProbationSchedule)
    }

    return request(app)
      .get(
        `/${journey}/view-booking/print-bookings?agencyCode=ALL&date=${formatDate(startOfToday(), 'dd-MM-yyyy')}&sort=DATE_TIME`,
      )
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRINT_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(heading).toEqual('Print bookings')

        if (journey === 'probation') {
          const expected: UnpaginatedBookingsRequest = {
            agencyType: 'probation',
            agencyCodes: ['P1', 'P2'],
            date: startOfToday(),
            sort: ['appointmentDate', 'startTime'],
          }
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(expected, user)
        }

        if (journey === 'court') {
          const expected: UnpaginatedBookingsRequest = {
            agencyType: 'court',
            agencyCodes: ['C1', 'C2'],
            date: startOfToday(),
            sort: ['appointmentDate', 'startTime'],
          }
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(expected, user)
        }
      })
  })

  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])(
    '%s journey - should render the default view page sorted by court/team date and time',
    (_: string, journey: string) => {
      if (journey === 'court') {
        videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(videoLinkCourtSchedule)
      } else {
        videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(videoLinkProbationSchedule)
      }

      return request(app)
        .get(
          `/${journey}/view-booking/print-bookings?agencyCode=ALL&date=${formatDate(startOfToday(), 'dd-MM-yyyy')}&sort=AGENCY_DATE_TIME`,
        )
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(auditService.logPageView).toHaveBeenCalledWith(Page.PRINT_BOOKINGS_PAGE, {
            who: user.username,
            correlationId: expect.any(String),
          })

          const $ = cheerio.load(res.text)
          const heading = getPageHeader($)

          expect(heading).toEqual('Print bookings')

          if (journey === 'probation') {
            const expected: UnpaginatedBookingsRequest = {
              agencyType: 'probation',
              agencyCodes: ['P1', 'P2'],
              date: startOfToday(),
              sort: ['probationTeamDescription', 'appointmentDate', 'startTime'],
            }
            expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
            expect(videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(
              expected,
              user,
            )
          }

          if (journey === 'court') {
            const expected: UnpaginatedBookingsRequest = {
              agencyType: 'court',
              agencyCodes: ['C1', 'C2'],
              date: startOfToday(),
              sort: ['courtDescription', 'appointmentDate', 'startTime'],
            }
            expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
            expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
            expect(videoLinkService.getUnpaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(
              expected,
              user,
            )
          }
        })
    },
  )

  const videoLinkCourtSchedule = [
    {
      videoBookingId: 1,
      prisonAppointmentId: 1,
      bookingType: 'COURT',
      statusCode: 'ACTIVE',
      createdByPrison: 'false',
      courtId: 1,
      courtCode: 'ABECV',
      courtDescription: 'Aberystwyth Crown',
      hearingType: 'APPEAL',
      hearingTypeDescription: 'Appeal Hearing',
      prisonCode: 'HEI',
      prisonName: 'HMP Hewell',
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_COURT_MAIN',
      appointmentTypeDescription: 'Video link - Court hearing',
      prisonLocKey: 'LOC-1',
      prisonLocDesc: 'Location 1',
      dpsLocationId: 'xxx-yyy-zzz',
      appointmentDate: '2024-04-20',
      startTime: '10:00',
      endTime: '10:30',
      createdTime: '2024-04-20 10:14:00',
      createdBy: 'TEST',
      prisonerName: 'Joe Bloggs',
      prisonLocationDescription: 'Wing A',
    } as unknown as ScheduleItem,
    {
      videoBookingId: 2,
      prisonAppointmentId: 2,
      bookingType: 'COURT',
      statusCode: 'ACTIVE',
      createdByPrison: 'false',
      courtId: 1,
      courtCode: 'ABECV',
      courtDescription: 'Aberystwyth Crown',
      hearingType: 'APPEAL',
      hearingTypeDescription: 'Appeal Hearing',
      prisonCode: 'NHI',
      prisonName: 'HMP New Hall',
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_COURT_MAIN',
      appointmentTypeDescription: 'Video link - Court hearing',
      prisonLocKey: 'LOC-1',
      prisonLocDesc: 'Location 1',
      dpsLocationId: 'xxx-yyy-zzz',
      appointmentDate: '2024-04-20',
      startTime: '11:00',
      endTime: '11:30',
      createdTime: '2024-04-20 10:14:00',
      createdBy: 'TEST',
      prisonerName: 'Joe Bloggs',
      prisonLocationDescription: 'Wing A',
    } as unknown as ScheduleItem,
  ]

  const videoLinkProbationSchedule = [
    {
      videoBookingId: 1,
      prisonAppointmentId: 1,
      bookingType: 'PROBATION',
      probationTeamId: 1,
      probationTeamCode: 'P1',
      probationTeamDescription: 'Probation 1',
      probationMeetingType: 'PSR',
      probationMeetingTypeDescription: 'Pre-sentence report',
      statusCode: 'ACTIVE',
      createdByPrison: 'false',
      prisonCode: 'HEI',
      prisonName: 'HMP Hewell',
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_PROBATION',
      appointmentTypeDescription: 'Video link - Probation meeting',
      prisonLocKey: 'LOC-1',
      prisonLocDesc: 'Location 1',
      dpsLocationId: 'xxx-yyy-zzz',
      appointmentDate: '2024-04-20',
      startTime: '10:00',
      endTime: '10:30',
      createdTime: '2024-04-20 10:14:00',
      createdBy: 'TEST',
      prisonerName: 'Joe Bloggs',
      prisonLocationDescription: 'Wing A',
    } as unknown as ScheduleItem,
    {
      videoBookingId: 2,
      prisonAppointmentId: 2,
      bookingType: 'PROBATION',
      probationTeamId: 1,
      probationTeamCode: 'P1',
      probationTeamDescription: 'Probation 1',
      probationMeetingType: 'RR',
      probationMeetingTypeDescription: 'Recall report',
      statusCode: 'ACTIVE',
      createdByPrison: 'false',
      prisonCode: 'NHI',
      prisonName: 'HMP New Hall',
      prisonerNumber: 'A1234AA',
      appointmentType: 'VLB_PROBATION',
      appointmentTypeDescription: 'Video link - Probation meeting',
      prisonLocKey: 'LOC-1',
      prisonLocDesc: 'Location 1',
      dpsLocationId: 'xxx-yyy-zzz',
      appointmentDate: '2024-04-20',
      startTime: '11:00',
      endTime: '11:30',
      createdTime: '2024-04-20 10:14:00',
      createdBy: 'TEST',
      prisonerName: 'Joe Bloggs',
      prisonLocationDescription: 'Wing A',
    } as unknown as ScheduleItem,
  ]
})
