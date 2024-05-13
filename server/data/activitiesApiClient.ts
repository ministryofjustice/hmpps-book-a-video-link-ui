import config from '../config'
import RestClient from './restClient'

export default class ActivitiesApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Activities Management API', config.apis.activitiesApi, token)
  }
}
