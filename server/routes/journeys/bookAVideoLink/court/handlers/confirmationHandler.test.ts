import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import { getByDataQa, getPageHeader, getValueByKey } from '../../../../testutils/cheerio'
import VideoLinkService from '../../../../../services/videoLinkService'
import PrisonerService from '../../../../../services/prisonerService'
import PrisonService from '../../../../../services/prisonService'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchApi/types'
import { Location, Prison, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/videoLinkService')
jest.mock('../../../../../services/prisonerService')
jest.mock('../../../../../services/prisonService')

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
  prisonerService.getPrisonerByPrisonerNumber.mockResolvedValue({
    firstName: 'Joe',
    lastName: 'Bloggs',
    prisonId: 'MDI',
    prisonerNumber: 'AA1234A',
  } as Prisoner)

  prisonService.getPrisonByCode.mockResolvedValue({ code: 'MDI', name: 'Moorland (HMP)' } as Prison)
  prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }] as Location[])
  videoLinkService.getVideoLinkBookingById.mockResolvedValue(getCourtBooking('AA1234A'))

  appSetup()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  it('should render the correct view page ', async () => {
    appSetup()

    await request(app)
      .get(`/court/booking/create/${journeyId()}/A1234AA/video-link-booking/confirmation/1`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
        expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('AA1234A', user)
        expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', false, user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('The video link has been booked')
        expect(bookAnotherLink).toEqual(`/court/prisoner-search/search`)

        expect(getValueByKey($, 'Name')).toEqual('Joe Bloggs (AA1234A)')
        expect(getValueByKey($, 'Prison')).toEqual('Moorland (HMP)')
        expect(getValueByKey($, 'Notes for prison staff')).toEqual('staff notes')
      })

    return expectJourneySession(app, 'bookACourtHearing', null)
  })

  it('should render the correct page in amend mode', async () => {
    videoLinkService.bookingIsAmendable.mockReturnValue(true)

    await request(app)
      .get(`/court/booking/amend/1/${journeyId()}/video-link-booking/confirmation`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.BOOKING_CONFIRMATION_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })

        expect(videoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(1, user)
        expect(prisonerService.getPrisonerByPrisonerNumber).toHaveBeenCalledWith('AA1234A', user)
        expect(prisonService.getAppointmentLocations).toHaveBeenCalledWith('MDI', false, user)

        const $ = cheerio.load(res.text)
        const heading = getPageHeader($)

        expect(heading).toEqual('The video link booking has been updated')
      })
    return expectJourneySession(app, 'bookACourtHearing', null)
  })
})

const getCourtBooking = (prisonerNumber: string) =>
  ({
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
    notesForStaff: 'staff notes',
  }) as VideoLinkBooking
