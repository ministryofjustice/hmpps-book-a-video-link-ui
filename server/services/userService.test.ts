import UserService from './userService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { User, UserGroup } from '../@types/manageUsersApi/types'
import createUser from '../testutils/createUser'
import UserPreferencesApiClient from '../data/userPreferencesApiClient'

jest.mock('../data/manageUsersApiClient')

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let userPreferencesApiClient: jest.Mocked<UserPreferencesApiClient>
  let userService: UserService

  beforeEach(() => {
    manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
    userService = new UserService(manageUsersApiClient, userPreferencesApiClient)
  })

  describe('getUser', () => {
    it('Retrieves and formats user name', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([])

      const result = await userService.getUser(createUser([]))

      expect(result.displayName).toEqual('John Smith')
    })

    it('Retrieves and formats roles', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([])

      const result = await userService.getUser(createUser(['ROLE_ONE', 'ROLE_TWO']))

      expect(result.roles).toEqual(['ONE', 'TWO'])
    })

    it('isCourtUser and isProbationUser are set correctly if user is part of VIDEO_LINK_PROBATION_USER only', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith', authSource: 'auth' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([{ groupCode: 'VIDEO_LINK_PROBATION_USER' }] as UserGroup[])

      const result = await userService.getUser(createUser([]))

      expect(result.isCourtUser).toEqual(false)
      expect(result.isProbationUser).toEqual(true)
    })

    it('isCourtUser and isProbationUser are set correctly if user is part of VIDEO_LINK_COURT_USER only', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith', authSource: 'auth' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([{ groupCode: 'VIDEO_LINK_COURT_USER' }] as UserGroup[])

      const result = await userService.getUser(createUser([]))

      expect(result.isCourtUser).toEqual(true)
      expect(result.isProbationUser).toEqual(false)
    })

    it('isCourtUser and isProbationUser are set correctly if user is part of VIDEO_LINK_COURT_USER and VIDEO_LINK_PROBATION_USER', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith', authSource: 'auth' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([
        { groupCode: 'VIDEO_LINK_COURT_USER' },
        { groupCode: 'VIDEO_LINK_PROBATION_USER' },
      ] as UserGroup[])

      const result = await userService.getUser(createUser([]))

      expect(result.isCourtUser).toEqual(true)
      expect(result.isProbationUser).toEqual(true)
    })

    it('Propagates error', async () => {
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(createUser([]))).rejects.toEqual(new Error('some error'))
    })

    it('isAdminUser is set to true when user roles include ROLE_BVLS_ADMIN', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith', authSource: 'auth' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([{ groupCode: 'VIDEO_LINK_COURT_USER' }] as UserGroup[])

      const result = await userService.getUser(createUser(['ROLE_BVLS_ADMIN']))

      expect(result.isAdminUser).toEqual(true)
    })

    it('isAdminUser is set to false without role ROLE_BVLS_ADMIN', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith', authSource: 'auth' } as User)
      manageUsersApiClient.getUserGroups.mockResolvedValue([{ groupCode: 'VIDEO_LINK_COURT_USER' }] as UserGroup[])

      const result = await userService.getUser(createUser([]))

      expect(result.isAdminUser).toEqual(false)
    })
  })
})
