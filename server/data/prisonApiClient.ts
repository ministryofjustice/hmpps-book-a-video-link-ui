import config from '../config'
import RestClient from './restClient'

export default class PrisonApiClient extends RestClient {
  constructor() {
    super('Prison API', config.apis.prisonApi)
  }
}
