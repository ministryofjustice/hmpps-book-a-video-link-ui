import config from '../config'
import RestClient from './restClient'

type UserPreferences = {
  items: string[]
}

export default class UserPreferencesApiClient extends RestClient {
  constructor() {
    super('User Preferences Api Client', config.apis.userPreferencesApi)
  }

  public getUserPreferences(preferenceName: string, user: Express.User): Promise<UserPreferences> {
    return this.get({ path: `/users/${user.username}/preferences/${preferenceName}` }, user)
  }
}
