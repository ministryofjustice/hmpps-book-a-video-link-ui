import PrisonerOffenderSearchApiClient from '../data/prisonerOffenderSearchApiClient'
import {
  AttributeSearchRequest,
  PagePrisoner,
  PaginationRequest,
  Prisoner,
} from '../@types/prisonerOffenderSearchApi/types'
import { PrisonerSearchJourney } from '../routes/journeys/bookAVideoLink/prisonerSearch/journey'

// Holding prison - people here should not be displayed in search results
const GHOST_PRISON = 'ZZGHI'

export default class PrisonerService {
  constructor(private readonly prisonerOffenderSearchApiClient: PrisonerOffenderSearchApiClient) {}

  public getPrisonerByPrisonerNumber(prisonerNumber: string, user: Express.User): Promise<Prisoner> {
    return this.prisonerOffenderSearchApiClient.getByPrisonerNumber(prisonerNumber, user)
  }

  public searchPrisonersByCriteria(
    criteria: PrisonerSearchJourney,
    pagination: PaginationRequest,
    user: Express.User,
  ): Promise<PagePrisoner> {
    const createStringMatcher = (attribute: string, condition: string, searchTerm: string) =>
      searchTerm ? { type: 'String', attribute, condition, searchTerm } : undefined

    const createDateMatcher = (attribute: string, searchTerm: string) =>
      searchTerm ? { type: 'Date', attribute, minValue: searchTerm, maxValue: searchTerm } : undefined

    const createPncMatcher = (pncNumber: string) => (criteria.pncNumber ? { type: 'PNC', pncNumber } : undefined)

    // For example:
    // (status = ACTIVE IN OR status = ACTIVE OUT) AND (firstName CONTAINS :firstName AND lastName CONTAINS :lastName AND prisonerNumber = :prisonerNumber AND pncNumber = :pncNumber)
    const searchQuery = {
      joinType: 'AND',
      queries: [
        {
          joinType: 'OR',
          matchers: [
            createStringMatcher('status', 'IS', 'ACTIVE IN'),
            createStringMatcher('status', 'IS', 'ACTIVE OUT'),
          ],
        },
        {
          joinType: 'AND',
          matchers: [
            createStringMatcher('firstName', 'CONTAINS', criteria.firstName),
            createStringMatcher('lastName', 'CONTAINS', criteria.lastName),
            createDateMatcher('dateOfBirth', criteria.dateOfBirth),
            createStringMatcher('prisonId', 'IS', criteria.prison),
            createStringMatcher('prisonId', 'IS_NOT', GHOST_PRISON),
            createStringMatcher('prisonerNumber', 'IS', criteria.prisonerNumber),
            createPncMatcher(criteria.pncNumber),
          ].filter(Boolean),
        },
      ],
    }

    return this.prisonerOffenderSearchApiClient.getByAttributes(
      searchQuery as AttributeSearchRequest,
      user,
      pagination,
      { attribute: 'firstName', order: 'ASC' },
    )
  }
}
