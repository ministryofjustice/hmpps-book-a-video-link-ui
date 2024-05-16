import config from '../config'
import RestClient, { TokenType } from './restClient'
import { User, UserGroup } from '../@types/manageUsersApi/types'

export default class ManageUsersApiClient extends RestClient {
  constructor() {
    super('Manage Users Api Client', config.apis.manageUsersApi)
  }

  public getUser(user: Express.User): Promise<User> {
    return this.get({ path: '/users/me' }, user, TokenType.USER_TOKEN)
  }

  public getUserGroups(userId: string, user: Express.User): Promise<UserGroup[]> {
    return this.get({ path: `/externalusers/${userId}/groups` }, user)
  }
}
