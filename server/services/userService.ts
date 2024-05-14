import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { User } from '../@types/manageUsersApi/types'

export interface UserDetails extends User {
  displayName: string
  roles: string[]
  isProbationUser: boolean
  isCourtUser: boolean
}

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getUser(user: Express.User): Promise<UserDetails> {
    const serviceUser = await this.manageUsersApiClient.getUser(user)
    const userGroups = await this.manageUsersApiClient.getUserGroups(serviceUser.userId, user)

    const isProbationUser = userGroups.some(g => g.groupCode === 'VIDEO_LINK_PROBATION_USER')
    const isCourtUser = userGroups.some(g => g.groupCode === 'VIDEO_LINK_COURT_USER')

    return {
      ...serviceUser,
      roles: this.getUserRoles(user.token),
      displayName: convertToTitleCase(serviceUser.name),
      isProbationUser,
      isCourtUser,
    }
  }

  getUserRoles(token: string): string[] {
    const { authorities: roles = [] } = jwtDecode(token) as { authorities?: string[] }
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }
}
