import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'
import { User, UserGroup } from '../@types/manageUsersApi/types'

export default class ManageUsersApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Manage Users Api Client', config.apis.manageUsersApi, token)
  }

  getUser(token: string): Promise<User> {
    logger.info('Getting user details: calling HMPPS Manage Users Api')
    return ManageUsersApiClient.restClient(token).get<User>({ path: '/users/me' })
  }

  getUserGroups(userId: string, token: string): Promise<UserGroup[]> {
    logger.info(`Getting user groups for user ID ${userId}: calling HMPPS Manage Users Api`)
    return ManageUsersApiClient.restClient(token).get<UserGroup[]>({ path: `/externalusers/${userId}/groups` })
  }
}
