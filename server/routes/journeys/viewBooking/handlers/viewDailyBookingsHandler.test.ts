import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'
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
    services: { auditService, courtsService, probationTeamsService, videoLinkService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  config.featureToggles.probationOnlyPrisons = undefined
  config.featureToggles.courtOnlyPrisons = undefined
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
  ])('%s journey - should render the correct view page', (_: string, journey: string) => {
    return request(app)
      .get(`/${journey}/view-booking`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_DAILY_BOOKINGS_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(heading).toEqual('Video link bookings')

        if (journey === 'probation') {
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(videoLinkService.getVideoLinkSchedule).toHaveBeenCalledWith('probation', 'P1', null, user)
        }

        if (journey === 'court') {
          expect(courtsService.getUserPreferences).toHaveBeenCalledTimes(2)
          expect(probationTeamsService.getUserPreferences).toHaveBeenCalledTimes(1)
          expect(videoLinkService.getVideoLinkSchedule).toHaveBeenCalledWith('court', 'C1', null, user)
        }
      })
  })

  it('should use query parameters for the search', () => {
    return request(app)
      .get(`/court/view-booking?date=20/04/2024&agencyCode=ABERCV`)
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenCalledWith(
          'court',
          'ABERCV',
          parseDatePickerDate('20/04/2024'),
          user,
        )
      })
  })

  it('should filter court bookings for prisons appearing in the PROBATION_ONLY_PRISONS list', () => {
    // New hall as a probation only prison
    config.featureToggles.probationOnlyPrisons = 'NHI'
    appSetup()

    // Mock a result with 2 bookings
    videoLinkService.getVideoLinkSchedule.mockResolvedValue(videoLinkCourtSchedule)

    return request(app)
      .get(`/court/view-booking?date=20/04/2024&agencyCode=ABERCV`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        expect(heading).toEqual('Video link bookings')
        expect(res.text).toContain('HMP Hewell')
        expect(res.text).not.toContain('HMP New Hall')

        // With no links provided it should also highlight this
        expect(res.text).toContain('Action: provide hearing link')

        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenCalledWith(
          'court',
          'ABERCV',
          parseDatePickerDate('20/04/2024'),
          user,
        )
      })
  })

  it('should filter probation bookings for prisons appearing in the COURT_ONLY_PRISONS list', () => {
    // New hall as a court only prison
    config.featureToggles.courtOnlyPrisons = 'NHI'
    appSetup()

    // Mock a result with 2 probation bookings
    videoLinkService.getVideoLinkSchedule.mockResolvedValue(videoLinkProbationSchedule)

    return request(app)
      .get(`/probation/view-booking?date=20/04/2024&agencyCode=P1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        expect(heading).toEqual('Video link bookings')
        expect(res.text).toContain('HMP Hewell')
        expect(res.text).not.toContain('HMP New Hall')

        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenCalledWith(
          'probation',
          'P1',
          parseDatePickerDate('20/04/2024'),
          user,
        )
      })
  })

  it('should not show the action label if either a HMCTS number or video url is present', () => {
    // Mock a result with 2 bookings - that both have links present.
    const scheduleWithLinks = [
      {
        ...videoLinkCourtSchedule[0],
        videoUrl: 'https://test.org',
      },
      {
        ...videoLinkCourtSchedule[1],
        hmctsNumber: '1234',
      },
    ]

    videoLinkService.getVideoLinkSchedule.mockResolvedValue(scheduleWithLinks)

    return request(app)
      .get(`/court/view-booking?date=20/04/2024&agencyCode=ABERCV`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        expect(heading).toEqual('Video link bookings')
        expect(res.text).toContain('HMP Hewell')
        expect(res.text).toContain('HMP New Hall')

        // Check that missing links are NOT highlighted
        expect(res.text).not.toContain('Action: provide hearing link')

        expect(videoLinkService.getVideoLinkSchedule).toHaveBeenCalledWith(
          'court',
          'ABERCV',
          parseDatePickerDate('20/04/2024'),
          user,
        )
      })
  })

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
    } as ScheduleItem & { prisonerName: string; prisonLocationDescription: string },
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
    } as ScheduleItem & { prisonerName: string; prisonLocationDescription: string },
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
    } as ScheduleItem & { prisonerName: string; prisonLocationDescription: string },
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
    } as ScheduleItem & { prisonerName: string; prisonLocationDescription: string },
  ]
})
