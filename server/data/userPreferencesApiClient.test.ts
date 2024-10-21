import nock from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import UserPreferencesApiClient from './userPreferencesApiClient'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

describe('userPreferencesApiClient', () => {
  let fakeUserPreferencesApiClient: nock.Scope
  let userPreferencesApiClient: UserPreferencesApiClient

  beforeEach(() => {
    fakeUserPreferencesApiClient = nock(config.apis.userPreferencesApi.url)
    userPreferencesApiClient = new UserPreferencesApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUserPreferences', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeUserPreferencesApiClient
        .get('/users/jbloggs/preferences/test_preference')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await userPreferencesApiClient.getUserPreferences('test_preference', user)
      expect(output).toEqual(response)
    })
  })
})
