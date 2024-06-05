import { dataAccess } from '../data'
import AuditService from './auditService'
import UserService from './userService'
import CourtsService from './courtsService'
import ProbationTeamsService from './probationTeamsService'
import PrisonService from './prisonService'
import PrisonerService from './prisonerService'
import VideoLinkService from './videoLinkService'

export const services = () => {
  const {
    applicationInfo,
    manageUsersApiClient,
    hmppsAuditClient,
    bookAVideoLinkApiClient,
    prisonerOffenderSearchApiClient,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const auditService = new AuditService(hmppsAuditClient)
  const courtsService = new CourtsService(bookAVideoLinkApiClient)
  const probationTeamsService = new ProbationTeamsService(bookAVideoLinkApiClient)
  const prisonService = new PrisonService(bookAVideoLinkApiClient)
  const prisonerService = new PrisonerService(prisonerOffenderSearchApiClient)
  const videoLinkService = new VideoLinkService(bookAVideoLinkApiClient)

  return {
    applicationInfo,
    userService,
    auditService,
    courtsService,
    probationTeamsService,
    prisonService,
    prisonerService,
    videoLinkService,
  }
}

export type Services = ReturnType<typeof services>
