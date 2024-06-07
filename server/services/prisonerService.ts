import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import {
  AttributeSearchRequest,
  PagePrisoner,
  PaginationRequest,
  Prisoner,
} from '../@types/prisonerOffenderSearchApi/types'
import { BookAVideoLinkJourney } from '../routes/journeys/bookAVideoLink/journey'

export default class PrisonerService {
  constructor(private readonly prisonerOffenderSearchApiClient: PrisonerOffenderSearchApiClient) {}

  public getPrisonerByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.prisonerOffenderSearchApiClient.getByPrisonerNumber(prisonerNumber, user)
  }

  public searchPrisonersByCriteria(
    criteria: BookAVideoLinkJourney['search'],
    pagination: PaginationRequest,
    user: Express.User,
  ): Promise<PagePrisoner> {
    const createStringMatcher = (attribute: string, condition: string, searchTerm: string) =>
      searchTerm ? { type: 'String', attribute, condition, searchTerm } : undefined

    const createDateMatcher = (attribute: string, searchTerm: string) =>
      searchTerm ? { type: 'Date', attribute, minValue: searchTerm, maxValue: searchTerm } : undefined

    const createPncMatcher = (pncNumber: string) => (criteria.pncNumber ? { type: 'PNC', pncNumber } : undefined)

    const matchers = [
      createStringMatcher('firstName', 'CONTAINS', criteria.firstName),
      createStringMatcher('lastName', 'CONTAINS', criteria.lastName),
      createDateMatcher('dateOfBirth', criteria.dateOfBirth),
      createStringMatcher('prisonId', 'IS', criteria.prison),
    ].filter(Boolean)

    const secondaryMatchers = [
      createStringMatcher('prisonerNumber', 'IS', criteria.prisonerNumber),
      createPncMatcher(criteria.pncNumber),
    ].filter(Boolean)

    const searchQuery = {
      queries: [
        {
          matchers: [createStringMatcher('inOutStatus', 'IS', 'IN')],
          joinType: 'AND',
          subQueries: [
            { joinType: 'AND', matchers },
            { joinType: 'OR', matchers: secondaryMatchers },
          ].filter(m => m.matchers.length > 0),
        },
      ],
    }

    return this.prisonerOffenderSearchApiClient.getByAttributes(
      searchQuery as AttributeSearchRequest,
      pagination,
      { attribute: 'firstName', order: 'ASC' },
      user,
    )
  }
}
