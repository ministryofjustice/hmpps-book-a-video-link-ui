import config from '../config'
import RestClient from './restClient'

export default class PrisonerOffenderSearchApiClient extends RestClient {
  constructor() {
    super('Prisoner Offender Search API', config.apis.prisonerSearchApi)
  }
}
