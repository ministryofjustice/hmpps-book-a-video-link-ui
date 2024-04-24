import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'

export default class LocationsInsidePrisonApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Locations Inside Prison API', config.apis.locationsInsidePrisonApi as ApiConfig)
  }
}
