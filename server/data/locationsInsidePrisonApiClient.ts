import config from '../config'
import RestClient from './restClient'

export default class LocationsInsidePrisonApiClient extends RestClient {
  constructor() {
    super('Locations Inside Prison API', config.apis.locationsInsidePrisonApi)
  }
}
