import config from '../config'
import RestClient from './restClient'

export default class ActivitiesApiClient extends RestClient {
  constructor() {
    super('Activities Management API', config.apis.activitiesApi)
  }
}
