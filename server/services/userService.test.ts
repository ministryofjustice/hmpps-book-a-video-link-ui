import UserService from './userService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import createUserToken from '../testutils/createUserToken'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { User, UserGroup } from '../@types/manageUsersApi/types'

jest.mock('../data/manageUsersApiClient')
jest.mock('../data/hmppsAuthClient')

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService

  describe('getUser', () => {
    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      userService = new UserService(manageUsersApiClient, hmppsAuthClient)
    })

    it('Retrieves and formats user name', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([])

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })

    it('Retrieves and formats roles', async () => {
      const token = createUserToken(['ROLE_ONE', 'ROLE_TWO'])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([])

      const result = await userService.getUser(token)

      expect(result.roles).toEqual(['ONE', 'TWO'])
    })

    it('isCourtUser and isProbationUser are set correctly if user is part of VIDEO_LINK_PROBATION_USER only', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([{ groupCode: 'VIDEO_LINK_PROBATION_USER' }] as UserGroup[])

      const result = await userService.getUser(token)

      expect(result.isCourtUser).toEqual(false)
      expect(result.isProbationUser).toEqual(true)
    })

    it('isCourtUser and isProbationUser are set correctly if user is part of VIDEO_LINK_COURT_USER only', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([{ groupCode: 'VIDEO_LINK_COURT_USER' }] as UserGroup[])

      const result = await userService.getUser(token)

      expect(result.isCourtUser).toEqual(true)
      expect(result.isProbationUser).toEqual(false)
    })

    it('isCourtUser and isProbationUser are set correctly if user is part of VIDEO_LINK_COURT_USER and VIDEO_LINK_PROBATION_USER', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([
        { groupCode: 'VIDEO_LINK_COURT_USER' },
        { groupCode: 'VIDEO_LINK_PROBATION_USER' },
      ] as UserGroup[])

      const result = await userService.getUser(token)

      expect(result.isCourtUser).toEqual(true)
      expect(result.isProbationUser).toEqual(true)
    })

    it('Propagates error', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})
