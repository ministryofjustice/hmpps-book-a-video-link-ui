import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import { Prisoner } from '../@types/prisonerOffenderSearchApi/types'

export default class PrisonerService {
  constructor(private readonly prisonerOffenderSearchApiClient: PrisonerOffenderSearchApiClient) {}

  public async getPrisonerByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.prisonerOffenderSearchApiClient.getByPrisonerNumber(prisonerNumber, user)
  }
}
