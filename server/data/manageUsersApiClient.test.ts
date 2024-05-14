import nock from 'nock'

import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

describe('manageUsersApiClient', () => {
  let fakeManageUsersApiClient: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient

  beforeEach(() => {
    fakeManageUsersApiClient = nock(config.apis.manageUsersApi.url)
    manageUsersApiClient = new ManageUsersApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeManageUsersApiClient
        .get('/users/me')
        .matchHeader('authorization', `Bearer ${user.token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUser(user)
      expect(output).toEqual(response)
    })
  })

  describe('getUserGroups', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeManageUsersApiClient
        .get('/externalusers/userid/groups')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUserGroups('userid', user)
      expect(output).toEqual(response)
    })
  })
})
