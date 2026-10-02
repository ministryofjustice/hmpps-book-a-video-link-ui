import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { User } from '../@types/manageUsersApi/types'

export interface UserDetails extends User {
  displayName: string
  roles: string[]
  isProbationUser: boolean
  isCourtUser: boolean
  isAdminUser: boolean
  jwtUserId?: string
  jwtUserUuid?: string
}

interface JwtPayload {
  authorities?: string[]
  user_id?: string
  user_uuid?: string
}

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  public async getUser(user: Express.User): Promise<UserDetails> {
    const serviceUser = await this.manageUsersApiClient.getUser(user)

    const isAuthUser = serviceUser.authSource === 'auth'
    const isDeliusUser = serviceUser.authSource === 'delius'

    const userGroups = isAuthUser && (await this.manageUsersApiClient.getUserGroups(serviceUser.userId, user))
    const jwtPayload = this.getJwtPayload(user.token)
    const roles = this.getUserRoles(jwtPayload)
    const userId = this.getUserId(jwtPayload)
    const userUuid = this.getUserUuid(jwtPayload)

    // Probation users can authenticate in two ways
    // - An external account with group membership of VIDEO_LINK_PROBATION and the role VIDEO_LINK_COURT_USER
    // - An nDelius account with NDelius BVLS role (which is mapped to BVLS_PROBATION by Auth)
    const isProbationUser =
      (isAuthUser && userGroups.some(g => g.groupCode === 'VIDEO_LINK_PROBATION_USER')) ||
      (isDeliusUser && roles.some(r => r === 'BVLS_PROBATION'))

    // Court users are only external accounts with group membership of VIDEO_LINK_COURT_USER and the role VIDEO_LINK_COURT_USER
    const isCourtUser = isAuthUser && userGroups.some(g => g.groupCode === 'VIDEO_LINK_COURT_USER')

    // Admin users are only external at present - until additional roles could be added to nDelius.
    const isAdminUser = isAuthUser && roles.some(r => r === 'BVLS_ADMIN')

    return {
      ...serviceUser,
      roles,
      displayName: convertToTitleCase(serviceUser.name),
      isProbationUser,
      isCourtUser,
      isAdminUser,
      jwtUserId: userId,
      jwtUserUuid: userUuid,
    }
  }

  private getJwtPayload(token: string): JwtPayload {
    return jwtDecode(token) as JwtPayload
  }

  private getUserRoles(jwtPayload: JwtPayload): string[] {
    const { authorities: roles = [] } = jwtPayload
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }

  private getUserId(jwtPayload: JwtPayload): string | undefined {
    const { user_id: userId } = jwtPayload
    return userId
  }

  private getUserUuid(jwtPayload: JwtPayload): string | undefined {
    const { user_uuid: userUuid } = jwtPayload
    return userUuid
  }
}
