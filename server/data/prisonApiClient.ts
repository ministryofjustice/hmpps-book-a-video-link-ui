import config from '../config'
import RestClient from './restClient'

export default class PrisonApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Prison API', config.apis.prisonApi, token)
  }
}
