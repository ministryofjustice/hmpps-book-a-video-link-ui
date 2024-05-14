import config from '../config'
import RestClient, { Client } from './restClient'
import { User, UserGroup } from '../@types/manageUsersApi/types'

export default class ManageUsersApiClient extends RestClient {
  constructor() {
    super('Manage Users Api Client', config.apis.manageUsersApi)
  }

  getUser(user: Express.User): Promise<User> {
    return this.get({ path: '/users/me' }, user, Client.USER_CLIENT)
  }

  getUserGroups(userId: string, user: Express.User): Promise<UserGroup[]> {
    return this.get({ path: `/externalusers/${userId}/groups` }, user)
  }
}
