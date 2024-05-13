import { dataAccess } from '../data'
import AuditService from './auditService'
import UserService from './userService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, hmppsAuditClient, hmppsAuthClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient, hmppsAuthClient)
  const auditService = new AuditService(hmppsAuditClient)

  return {
    applicationInfo,
    userService,
    auditService,
  }
}

export type Services = ReturnType<typeof services>
