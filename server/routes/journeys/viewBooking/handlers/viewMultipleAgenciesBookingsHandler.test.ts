import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { startOfToday } from 'date-fns'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getByDataQa, getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { Court, ProbationTeam, ScheduleItem } from '../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../config'
import { PaginatedBookingsRequest } from '../../../../data/bookAVideoLinkApiClient'

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
  ])('%s journey - should render the default view page', (_: string, journey: string) => {
    if (journey === 'court') {
      videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(paginatedCourtSchedule)
    } else {
      videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(paginatedProbationSchedule)
    }

    return request(app)
      .get(`/${journey}/view-booking`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_MULTIPLE_AGENCIES_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const exportBookingsLink = getByDataQa($, 'export-bookings')
        const printBookingsLink = getByDataQa($, 'print-bookings')

        expect(heading).toEqual('Video link bookings')
        expect(exportBookingsLink.length).toBe(1)
        expect(printBookingsLink.length).toBe(1)

        if (journey === 'probation') {
          const expected: PaginatedBookingsRequest = {
            agencyType: 'probation',
            agencyCodes: ['P1', 'P2'],
            date: startOfToday(),
            pagination: { page: 0, size: 10, sort: ['appointmentDate', 'startTime'] },
          }
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(expected, user)
        }

        if (journey === 'court') {
          const expected: PaginatedBookingsRequest = {
            agencyType: 'court',
            agencyCodes: ['C1', 'C2'],
            date: startOfToday(),
            pagination: { page: 0, size: 10, sort: ['appointmentDate', 'startTime'] },
          }
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(expected, user)
        }
      })
  })

  it.each([
    ['Probation', 'probation'],
    ['Court', 'court'],
  ])('%s journey - should not show download and print links when no bookings', (_: string, journey: string) => {
    videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules.mockResolvedValue(paginatedEmptySchedule)

    return request(app)
      .get(`/${journey}/view-booking`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_MULTIPLE_AGENCIES_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const exportBookingsLink = getByDataQa($, 'export-bookings')
        const printBookingsLink = getByDataQa($, 'print-bookings')

        expect(heading).toEqual('Video link bookings')
        expect(exportBookingsLink.length).toBe(0)
        expect(printBookingsLink.length).toBe(0)

        if (journey === 'probation') {
          const expected: PaginatedBookingsRequest = {
            agencyType: 'probation',
            agencyCodes: ['P1', 'P2'],
            date: startOfToday(),
            pagination: { page: 0, size: 10, sort: ['appointmentDate', 'startTime'] },
          }
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(expected, user)
        }

        if (journey === 'court') {
          const expected: PaginatedBookingsRequest = {
            agencyType: 'court',
            agencyCodes: ['C1', 'C2'],
            date: startOfToday(),
            pagination: { page: 0, size: 10, sort: ['appointmentDate', 'startTime'] },
          }
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(videoLinkService.getPaginatedMultipleAgenciesVideoLinkSchedules).toHaveBeenCalledWith(expected, user)
        }
      })
  })

  const paginatedEmptySchedule = {
    content: [] as ScheduleItem[],
    page: {
      size: 0,
      number: 0,
      totalElements: 0,
      totalPages: 0,
    },
  }

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

  const paginatedCourtSchedule = {
    content: videoLinkCourtSchedule,
    page: {
      size: 0,
      number: 0,
      totalElements: 0,
      totalPages: 0,
    },
  }

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

  const paginatedProbationSchedule = {
    content: videoLinkProbationSchedule,
    page: {
      size: 0,
      number: 0,
      totalElements: 0,
      totalPages: 0,
    },
  }
})
