import config from '../config'
import RestClient from './restClient'
import {
  AttributeSearchRequest,
  PagePrisoner,
  PaginationRequest,
  Prisoner,
} from '../@types/prisonerOffenderSearchApi/types'

export default class PrisonerOffenderSearchApiClient extends RestClient {
  constructor() {
    super('Prisoner Offender Search API', config.apis.prisonerSearchApi)
  }

  async getByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.get({ path: `/prisoner/${prisonerNumber}` }, user)
  }

  async getByAttributes(
    attributeSearchRequest: AttributeSearchRequest,
    pagination: PaginationRequest,
    sortBy: { attribute: string; order: 'ASC' | 'DESC' },
    user: Express.User,
  ): Promise<PagePrisoner> {
    return this.post(
      {
        path: `/attribute-search`,
        data: attributeSearchRequest,
        query: { ...pagination, sort: [sortBy.attribute, sortBy.order === 'DESC' ? 'DESC' : 'ASC'] },
      },
      user,
    )
  }
}
