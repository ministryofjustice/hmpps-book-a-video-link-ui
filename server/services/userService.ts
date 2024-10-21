import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { User } from '../@types/manageUsersApi/types'
import UserPreferencesApiClient from '../data/userPreferencesApiClient'
import logger from '../../logger'

export interface UserDetails extends User {
  displayName: string
  roles: string[]
  isProbationUser: boolean
  isCourtUser: boolean
  isAdminUser: boolean
}

export default class UserService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly userPreferencesApiClient: UserPreferencesApiClient,
  ) {}

  public async getUser(user: Express.User): Promise<UserDetails> {
    const serviceUser = await this.manageUsersApiClient.getUser(user)
    const isAuthUser = serviceUser.authSource === 'auth'

    const userGroups = isAuthUser && (await this.manageUsersApiClient.getUserGroups(serviceUser.userId, user))
    const roles = this.getUserRoles(user.token)
    const isProbationUser = isAuthUser && userGroups.some(g => g.groupCode === 'VIDEO_LINK_PROBATION_USER')
    const isCourtUser = isAuthUser && userGroups.some(g => g.groupCode === 'VIDEO_LINK_COURT_USER')
    const isAdminUser = isAuthUser && roles.some(r => r === 'BVLS_ADMIN')

    return {
      ...serviceUser,
      roles,
      displayName: convertToTitleCase(serviceUser.name),
      isProbationUser,
      isCourtUser,
      isAdminUser,
    }
  }

  public async getUserPreferences(user: Express.User) {
    logger.info(`BVLS: Fetching user preferences from user-preferences-api for User ID ${user.userId}`)
    return this.userPreferencesApiClient.getUserPreferences('video_link_booking.preferred_courts', user)
  }

  private getUserRoles(token: string): string[] {
    const { authorities: roles = [] } = jwtDecode(token) as { authorities?: string[] }
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }
}
