import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import { dataAccess } from '../data'
import UserService from './userService'
import CourtsService from './courtsService'
import ProbationTeamsService from './probationTeamsService'
import PrisonService from './prisonService'
import PrisonerService from './prisonerService'
import VideoLinkService from './videoLinkService'
import ReferenceDataService from './referenceDataService'
import CourtBookingService from './courtBookingService'
import ProbationBookingService from './probationBookingService'
import AdminService from './adminService'
import TelemetryService from './telemetryService'
import logger from '../../logger'
import config from '../config'

export const services = () => {
  const {
    applicationInfo,
    manageUsersApiClient,
    bookAVideoLinkApiClient,
    prisonerOffenderSearchApiClient,
    applicationInsightsClient,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const auditService = AuditServiceFactory.createInstance(config.sqs.audit, logger)
  const courtBookingService = new CourtBookingService(bookAVideoLinkApiClient)
  const courtsService = new CourtsService(bookAVideoLinkApiClient)
  const probationBookingService = new ProbationBookingService(bookAVideoLinkApiClient)
  const probationTeamsService = new ProbationTeamsService(bookAVideoLinkApiClient)
  const prisonService = new PrisonService(bookAVideoLinkApiClient)
  const prisonerService = new PrisonerService(prisonerOffenderSearchApiClient)
  const videoLinkService = new VideoLinkService(bookAVideoLinkApiClient, prisonerOffenderSearchApiClient)
  const referenceDataService = new ReferenceDataService(bookAVideoLinkApiClient)
  const adminService = new AdminService(bookAVideoLinkApiClient)
  const telemetryService = new TelemetryService(applicationInsightsClient)

  return {
    applicationInfo,
    userService,
    auditService,
    courtBookingService,
    courtsService,
    probationBookingService,
    probationTeamsService,
    prisonService,
    prisonerService,
    referenceDataService,
    videoLinkService,
    adminService,
    telemetryService,
  }
}

export type Services = ReturnType<typeof services>
