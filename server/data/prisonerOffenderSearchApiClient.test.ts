import nock, { RequestBodyMatcher } from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import PrisonerOffenderSearchApiClient from './prisonerOffenderSearchApiClient'
import { AttributeSearchRequest } from '../@types/prisonerOffenderSearchApi/types'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

describe('prisonerOffenderSearchApiClient', () => {
  let fakePrisonerOffenderSearchApiClient: nock.Scope
  let prisonerOffenderSearchApiClient: PrisonerOffenderSearchApiClient

  beforeEach(() => {
    fakePrisonerOffenderSearchApiClient = nock(config.apis.prisonerSearchApi.url)
    prisonerOffenderSearchApiClient = new PrisonerOffenderSearchApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getByPrisonerNumber', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonerOffenderSearchApiClient
        .get('/prisoner/ABC123')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await prisonerOffenderSearchApiClient.getByPrisonerNumber('ABC123', user)
      expect(output).toEqual(response)
    })
  })

  describe('getByPrisonerNumber', () => {
    it('should return data from api', async () => {
      const response = [{ data: 'data' }]

      fakePrisonerOffenderSearchApiClient
        .post('/prisoner-search/prisoner-numbers', { prisonerNumbers: ['ABC123'] } as RequestBodyMatcher)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await prisonerOffenderSearchApiClient.getByPrisonerNumbers(['ABC123'], user)
      expect(output).toEqual(response)
    })

    it('should return empty list by default', async () => {
      const response = <unknown>[]
      const output = await prisonerOffenderSearchApiClient.getByPrisonerNumbers([], user)
      expect(output).toEqual(response)
    })
  })

  describe('getByAttributes', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonerOffenderSearchApiClient
        .post('/attribute-search', { joinType: 'OR', queries: [] } as RequestBodyMatcher)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await prisonerOffenderSearchApiClient.getByAttributes(
        { joinType: 'OR', queries: [] } as AttributeSearchRequest,
        user,
      )
      expect(output).toEqual(response)
    })

    it('with pagination - should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonerOffenderSearchApiClient
        .post('/attribute-search?page=1&size=10', { joinType: 'OR', queries: [] } as RequestBodyMatcher)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await prisonerOffenderSearchApiClient.getByAttributes(
        { joinType: 'OR', queries: [] } as AttributeSearchRequest,
        user,
        { page: 1, size: 10 },
      )
      expect(output).toEqual(response)
    })

    it('with sorting - should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonerOffenderSearchApiClient
        .post('/attribute-search?sort=firstName&sort=ASC', { joinType: 'OR', queries: [] } as RequestBodyMatcher)
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await prisonerOffenderSearchApiClient.getByAttributes(
        { joinType: 'OR', queries: [] } as AttributeSearchRequest,
        user,
        null,
        { attribute: 'firstName', order: 'ASC' },
      )
      expect(output).toEqual(response)
    })
  })
})
