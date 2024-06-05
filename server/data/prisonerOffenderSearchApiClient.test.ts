import nock from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import PrisonerOffenderSearchApiClient from './prisonerOffenderSearchApiClient'

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
})
