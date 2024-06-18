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

  async getByPrisonerNumbers(prisonerNumbers: string[], user: Express.User): Promise<Prisoner[]> {
    return prisonerNumbers.length
      ? this.post({ path: `/prisoner-search/prisoner-numbers`, data: { prisonerNumbers } }, user)
      : []
  }

  async getByAttributes(
    attributeSearchRequest: AttributeSearchRequest,
    user: Express.User,
    pagination?: PaginationRequest,
    sortBy?: { attribute: string; order: 'ASC' | 'DESC' },
  ): Promise<PagePrisoner> {
    const paginationParams = pagination ?? {}
    const sortParams = sortBy ? [sortBy.attribute, sortBy.order === 'DESC' ? 'DESC' : 'ASC'] : undefined

    return this.post(
      {
        path: `/attribute-search`,
        data: attributeSearchRequest,
        query: { ...paginationParams, ...(sortParams && { sort: sortParams }) },
      },
      user,
    )
  }
}
