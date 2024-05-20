import nock from 'nock'

import config from '../config'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'jbloggs' } as Express.User

describe('manageUsersApiClient', () => {
  let fakeBookAVideoLinkApiClient: nock.Scope
  let bookAVideoLinkApiClient: BookAVideoLinkApiClient

  beforeEach(() => {
    fakeBookAVideoLinkApiClient = nock(config.apis.bookAVideoLinkApi.url)
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient()
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAllEnabledCourts', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/courts/enabled')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAllEnabledCourts(user)
      expect(output).toEqual(response)
    })
  })

  describe('getUserCourtPreferences', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/courts/user-preferences')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getUserCourtPreferences(user)
      expect(output).toEqual(response)
    })
  })

  describe('setUserCourtPreferences', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/courts/user-preferences/set', {
          courtCodes: ['TEST'],
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.setUserCourtPreferences(['TEST'], user)
      expect(output).toEqual(response)
    })
  })

  describe('getAllEnabledProbationTeams', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/probation-teams/enabled')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAllEnabledProbationTeams(user)
      expect(output).toEqual(response)
    })
  })

  describe('getUserProbationTeamPreferences', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .get('/probation-teams/user-preferences')
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getUserProbationTeamPreferences(user)
      expect(output).toEqual(response)
    })
  })

  describe('setUserProbationTeamPreferences', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApiClient
        .post('/probation-teams/user-preferences/set', {
          probationTeamCodes: ['TEST'],
        })
        .matchHeader('authorization', `Bearer systemToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.setUserProbationTeamPreferences(['TEST'], user)
      expect(output).toEqual(response)
    })
  })
})
