import config from '../config'
import RestClient from './restClient'
import { Prisoner } from '../@types/prisonerOffenderSearchApi/types'

export default class PrisonerOffenderSearchApiClient extends RestClient {
  constructor() {
    super('Prisoner Offender Search API', config.apis.prisonerSearchApi)
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.get({ path: `/prisoner/${prisonerNumber}` }, user)
  }
}
