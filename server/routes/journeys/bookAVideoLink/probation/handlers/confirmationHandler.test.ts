import { AuditService } from '@ministryofjustice/hmpps-audit-client'
import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { formatDate, startOfToday } from 'date-fns'
import { appWithAllRoutes, journeyId, user } from '../../../../testutils/appSetup'
import Page from '../../../../enumerator/page'
import { getByDataQa, getPageHeader, getValueByKey } from '../../../../testutils/cheerio'
import VideoLinkService from '../../../../../services/videoLinkService'
import PrisonerService from '../../../../../services/prisonerService'
import PrisonService from '../../../../../services/prisonService'
import expectJourneySession from '../../../../testutils/testUtilRoute'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchApi/types'
import { Location, Prison, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { toViewBookingsSearchParams } from '../../../../../utils/utils'

jest.mock('@ministryofjustice/hmpps-audit-client')
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

  videoLinkService.getVideoLinkBookingById.mockResolvedValue(getProbationBooking('AA1234A'))
  prisonService.getPrisonByCode.mockResolvedValue({ code: 'MDI', name: 'Moorland (HMP)' } as Prison)
  prisonService.getAppointmentLocations.mockResolvedValue([{ key: 'KEY', description: 'description' }] as Location[])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET', () => {
  const confirmationTextForProbationOfficerWithoutJusticeEmail =
    'We have emailed you with the video link details. An email has also been sent to the prison.'
  const confirmationTextFprProbationOfficerWithJusticeEmail =
    'We have emailed you, and the probation officer with the video link details. An email has also been sent to the prison.'

  it.each([
    ['EMAIL@JUSTICE.GOV.UK', confirmationTextFprProbationOfficerWithJusticeEmail],
    ['email@justice.gov.uk', confirmationTextFprProbationOfficerWithJusticeEmail],
    ['email@jusTIce.gOV.Uk', confirmationTextFprProbationOfficerWithJusticeEmail],
    ['email@digital.justice.gov.uk', confirmationTextForProbationOfficerWithoutJusticeEmail],
    ['email@justice.gov.ukk', confirmationTextForProbationOfficerWithoutJusticeEmail],
    [undefined, confirmationTextForProbationOfficerWithoutJusticeEmail],
    [null, confirmationTextForProbationOfficerWithoutJusticeEmail],
  ])('should render the correct view page for officer details [%s] expected [%s]', async (email, expected) => {
    appSetup()

    videoLinkService.getVideoLinkBookingById.mockResolvedValue(getProbationBooking('AA1234A', email))

    await request(app)
      .get(`/probation/booking/create/${journeyId()}/A1234AA/video-link-booking/confirmation/1`)
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
        const confirmationText = getByDataQa($, 'confirmation-text')
        const bookAnotherLink = getByDataQa($, 'bookAnotherLink').attr('href')

        expect(heading).toEqual('The video link has been booked')
        expect(confirmationText.text()).toContain(expected)
        expect(bookAnotherLink).toEqual(`/probation/prisoner-search/search`)

        expect(getValueByKey($, 'Prisoner name')).toEqual('Joe Bloggs (AA1234A)')
        expect(getValueByKey($, 'Prison')).toEqual('Moorland (HMP)')
        expect(getValueByKey($, 'Notes for prison staff')).toEqual('staff notes')
      })
    return expectJourneySession(app, 'bookAProbationMeeting', null)
  })

  it('should render the correct page in amend mode', async () => {
    const journeySession = {
      agencyCode: 'ALL',
      fromDate: formatDate(startOfToday(), 'dd-MM-yyyy'),
      toDate: formatDate(startOfToday(), 'dd-MM-yyyy'),
      page: 1,
      sort: 'DATE_TIME',
    }

    appSetup({ viewMultipleAgencyBookingsJourney: journeySession })

    videoLinkService.bookingIsAmendable.mockReturnValue(true)

    await request(app)
      .get(`/probation/booking/amend/1/${journeyId()}/video-link-booking/confirmation`)
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

        const exitToAllBookingsLink = getByDataQa($, 'exit-to-all-bookings-link').attr('href')
        expect(exitToAllBookingsLink).toEqual(`/probation/view-booking?${toViewBookingsSearchParams(journeySession)}`)
      })
    return expectJourneySession(app, 'bookAProbationMeeting', null)
  })
})

const getProbationBooking = (prisonerNumber: string, probationOfficerEmail: string = null) =>
  ({
    bookingType: 'PROBATION',
    probationTeamCode: 'PROBATION_CODE',
    prisonAppointments: [
      {
        prisonCode: 'MDI',
        prisonerNumber,
        appointmentType: 'VLB_PROBATION',
        dpsLocationId: 'VCC-ROOM-1',
        appointmentDate: formatDate(startOfToday(), 'yyyy-MM-dd'),
        startTime: '11:30',
        endTime: '12:30',
      },
    ],

    probationTeamDescription: 'Barnet PPOC',
    probationMeetingTypeDescription: 'Pre-sentence report',
    videoLinkUrl: 'https://video.here.com',
    notesForStaff: 'staff notes',
    additionalBookingDetails: {
      contactEmail: probationOfficerEmail,
    },
  }) as VideoLinkBooking
