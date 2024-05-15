import { dataAccess } from '../data'
import AuditService from './auditService'
import UserService from './userService'
import CourtsService from './courtsService'
import ProbationTeamsService from './probationTeamsService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, hmppsAuditClient, bookAVideoLinkApiClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const auditService = new AuditService(hmppsAuditClient)
  const courtsService = new CourtsService(bookAVideoLinkApiClient)
  const probationTeamsService = new ProbationTeamsService(bookAVideoLinkApiClient)

  return {
    applicationInfo,
    userService,
    auditService,
    courtsService,
    probationTeamsService,
  }
}

export type Services = ReturnType<typeof services>
