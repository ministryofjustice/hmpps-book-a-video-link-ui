import type { Express } from 'express'
import request from 'supertest'
import cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import { getPageHeader } from '../../../testutils/cheerio'
import VideoLinkService from '../../../../services/videoLinkService'
import CourtsService from '../../../../services/courtsService'
import ProbationTeamsService from '../../../../services/probationTeamsService'
import { parseDatePickerDate } from '../../../../utils/utils'

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
  appSetup()

  courtsService.getUserPreferences.mockResolvedValue([
    { code: 'C1', description: 'Court 1' },
    { code: 'C2', description: 'Court 2' },
  ])
  probationTeamsService.getUserPreferences.mockResolvedValue([
    { code: 'P1', description: 'Probation 1' },
    { code: 'P2', description: 'Probation 2' },
  ])
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
})
