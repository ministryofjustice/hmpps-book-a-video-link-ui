import AbstractHmppsRestClient from './abstractHmppsRestClient'
import config, { ApiConfig } from '../config'

export default class PrisonerOffenderSearchApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Prisoner Offender Search API', config.apis.prisonerSearchApi as ApiConfig)
  }
}
