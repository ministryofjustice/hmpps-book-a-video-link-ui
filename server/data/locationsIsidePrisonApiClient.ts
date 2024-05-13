import config from '../config'
import RestClient from './restClient'

export default class LocationsInsidePrisonApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Locations Inside Prison API', config.apis.locationsInsidePrisonApi, token)
  }
}
