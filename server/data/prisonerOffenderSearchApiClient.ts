import config from '../config'
import RestClient from './restClient'

export default class PrisonerOffenderSearchApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Prisoner Offender Search API', config.apis.prisonerSearchApi, token)
  }
}
