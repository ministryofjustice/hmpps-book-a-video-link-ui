import { dataAccess } from '../data'
import AuditService from './auditService'
import UserService from './userService'
import CourtsService from './courtsService'
import ProbationTeamsService from './probationTeamsService'
import PrisonService from './prisonService'
import PrisonerService from './prisonerService'
import VideoLinkService from './videoLinkService'
import ReferenceDataService from './referenceDataService'
import CourtBookingService from './courtBookingService'
import ProbationBookingService from './probationBookingService'

export const services = () => {
  const {
    applicationInfo,
    manageUsersApiClient,
    userPreferencesApiClient,
    hmppsAuditClient,
    bookAVideoLinkApiClient,
    prisonerOffenderSearchApiClient,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient, userPreferencesApiClient)
  const auditService = new AuditService(hmppsAuditClient)
  const courtBookingService = new CourtBookingService(bookAVideoLinkApiClient)
  const courtsService = new CourtsService(bookAVideoLinkApiClient)
  const probationBookingService = new ProbationBookingService(bookAVideoLinkApiClient)
  const probationTeamsService = new ProbationTeamsService(bookAVideoLinkApiClient)
  const prisonService = new PrisonService(bookAVideoLinkApiClient)
  const prisonerService = new PrisonerService(prisonerOffenderSearchApiClient)
  const videoLinkService = new VideoLinkService(bookAVideoLinkApiClient, prisonerOffenderSearchApiClient)
  const referenceDataService = new ReferenceDataService(bookAVideoLinkApiClient)

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
  }
}

export type Services = ReturnType<typeof services>
