import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { User } from '../@types/manageUsersApi/types'
import { HmppsAuthClient } from '../data'

export interface UserDetails extends User {
  displayName: string
  roles: string[]
  isProbationUser: boolean
  isCourtUser: boolean
}

export default class UserService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(token)
    const userGroups = await this.manageUsersApiClient.getUserGroups(
      user.userId,
      await this.hmppsAuthClient.getSystemClientToken(user.username),
    )

    const isProbationUser = userGroups.some(g => g.groupCode === 'VIDEO_LINK_PROBATION_USER')
    const isCourtUser = userGroups.some(g => g.groupCode === 'VIDEO_LINK_COURT_USER')

    return {
      ...user,
      roles: this.getUserRoles(token),
      displayName: convertToTitleCase(user.name),
      isProbationUser,
      isCourtUser,
    }
  }

  getUserRoles(token: string): string[] {
    const { authorities: roles = [] } = jwtDecode(token) as { authorities?: string[] }
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }
}
