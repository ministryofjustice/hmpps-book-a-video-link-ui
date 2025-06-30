import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { existsByDataQa, existsByKey, getByDataQa, getPageHeader, getValueByKey } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import PrisonerService from '../../../../services/prisonerService'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchApi/types'
import { Location, Prison, VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'
import config from '../../../../config'

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
  config.featureToggles.masterPublicPrivateNotes = true
  config.featureToggles.hmctsLinkAndGuestPin = true

  app = appWithAllRoutes({
    services: { auditService, videoLinkService, prisonerService, prisonService },
    userSupplier: () => user,
    journeySessionSupplier: () => journeySession,
  })
}

beforeEach(() => {
  appSetup()

  prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
    firstName: 'Joe',
    lastName: 'Bloggs',
    prisonId: 'MDI',
    prisonerNumber: 'AA1234A',
  } as Prisoner)
  prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }] as Location[])
  videoLinkService.bookingIsAmendable.mockReturnValue(true)
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
    } as Prisoner)
    prisonService.getPrisonByCode.mockResolvedValue({ code: 'MDI', name: 'Moorland (HMP)' } as Prison)
    prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }] as Location[])

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
        expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', false, user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const changeLink = getByDataQa($, 'change-link').attr('href')

        expect(heading).toEqual('Joe Bloggs’s video link details')
        expect(existsByDataQa($, 'cancelled-banner')).toBe(false)
        expect(changeLink).toEqual(`/${journey}/booking/amend/1001/video-link-booking`)

        expect(getValueByKey($, 'Prisoner name')).toEqual('Joe Bloggs (AA1234A)')
        expect(getValueByKey($, 'Prison')).toEqual('Moorland (HMP)')

        const courtFields = [
          'Court',
          'Hearing type',
          'Pre-court hearing time',
          'Pre-court hearing room',
          'Pre-court hearing link (PVL)',
          'Court hearing time',
          'Court hearing room',
          'Court hearing link (CVP)',
          'Post-court hearing time',
          'Post-court hearing room',
          'Post-court hearing link (PVL)',
        ]

        const probationFields = [
          'Probation team',
          "Probation officer's full name",
          'Email address',
          'UK phone number',
          'Meeting type',
          'Meeting time',
          'Prison video link (PVL)',
        ]

        courtFields.forEach(field => expect(existsByKey($, field)).toBe(journey === 'court'))
        probationFields.forEach(field => expect(existsByKey($, field)).toBe(journey === 'probation'))
      })
  })

  it("Options to change the booking are not available when it's cancelled", () => {
    videoLinkService.getVideoLinkBookingById.mockResolvedValue({
      ...getCourtBooking('AA1234A'),
      statusCode: 'CANCELLED',
    })
    videoLinkService.bookingIsAmendable.mockReturnValue(false)

    return request(app)
      .get(`/court/view-booking/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const changeLink = getByDataQa($, 'change-link').attr('href')

        expect(heading).toEqual('Joe Bloggs’s video link details')
        expect(changeLink).toBeUndefined()
        expect(existsByDataQa($, 'cancelled-banner')).toBe(true)
      })
  })

  it("Options to change the court booking are not available when it's no longer amendable", () => {
    videoLinkService.getVideoLinkBookingById.mockResolvedValue({
      ...getCourtBooking('AA1234A'),
    })
    videoLinkService.bookingIsAmendable.mockReturnValue(false)

    return request(app)
      .get(`/court/view-booking/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const changeLink = getByDataQa($, 'change-link').attr('href')
        const changeHearingType = getByDataQa($, 'change-hearing-type').attr('href')
        const changeCourtDate = getByDataQa($, 'change-court-date').attr('href')
        const changeGuestPin = getByDataQa($, 'change-guest-pin').attr('href')
        const changePreLocation = getByDataQa($, 'change-pre-location').attr('href')
        const changeCourtTime = getByDataQa($, 'change-court-time').attr('href')
        const changeLocation = getByDataQa($, 'change-location').attr('href')
        const changeVideoUrl = getByDataQa($, 'change-video-url').attr('href')
        const changePostLocation = getByDataQa($, 'change-post-location').attr('href')
        const changeNotes = getByDataQa($, 'change-notes').attr('href')

        expect(heading).toEqual('Joe Bloggs’s video link details')
        expect(changeLink).toBeUndefined()
        expect(changeHearingType).toBeUndefined()
        expect(changeCourtDate).toBeUndefined()
        expect(changePreLocation).toBeUndefined()
        expect(changeCourtTime).toBeUndefined()
        expect(changeLocation).toBeUndefined()
        expect(changeVideoUrl).toBeUndefined()
        expect(changePostLocation).toBeUndefined()
        expect(changeNotes).toBeUndefined()
        expect(changeGuestPin).toBeUndefined()
      })
  })

  it("Options to change the court booking are available when it's amendable", () => {
    videoLinkService.getVideoLinkBookingById.mockResolvedValue({
      ...getCourtBooking('AA1234A'),
    })
    videoLinkService.bookingIsAmendable.mockReturnValue(true)

    return request(app)
      .get(`/court/view-booking/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(heading).toEqual('Joe Bloggs’s video link details')
        expect(existsByDataQa($, 'change-link')).toBe(true)
        expect(existsByDataQa($, 'change-hearing-type')).toBe(true)
        expect(existsByDataQa($, 'change-court-date')).toBe(true)
        expect(existsByDataQa($, 'change-guest-pin')).toBe(true)
        expect(existsByDataQa($, 'change-pre-location')).toBe(true)
        expect(existsByDataQa($, 'change-court-time')).toBe(true)
        expect(existsByDataQa($, 'change-location')).toBe(true)
        expect(existsByDataQa($, 'change-video-url')).toBe(true)
        expect(existsByDataQa($, 'change-post-location')).toBe(true)
        expect(existsByDataQa($, 'change-notes')).toBe(true)
      })
  })
})

const getCourtBooking = (prisonerNumber: string) =>
  ({
    videoLinkBookingId: 1001,
    bookingType: 'COURT',
    prisonAppointments: [
      {
        prisonCode: 'MDI',
        prisonerNumber,
        appointmentType: 'VLB_COURT_PRE',
        prisonLocKey: 'VCC-ROOM-1',
        appointmentDate: '2024-04-05',
        startTime: '11:15',
        endTime: '11:30',
      },
      {
        prisonCode: 'MDI',
        prisonerNumber,
        appointmentType: 'VLB_COURT_MAIN',
        prisonLocKey: 'VCC-ROOM-1',
        appointmentDate: '2024-04-05',
        startTime: '11:30',
        endTime: '12:30',
      },
      {
        prisonCode: 'MDI',
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
    notesForStaff: 'notes',
  }) as VideoLinkBooking

const getProbationBooking = (prisonerNumber: string) =>
  ({
    videoLinkBookingId: 1001,
    bookingType: 'PROBATION',
    prisonAppointments: [
      {
        prisonCode: 'MDI',
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
  }) as VideoLinkBooking
