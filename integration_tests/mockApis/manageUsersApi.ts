import { stubGet } from './wiremock'

enum UserType {
  COURT = 'COURT',
  PROBATION = 'PROBATION',
}

const stubUser = (name: string = 'john smith') =>
  stubGet('/manage-users-api/users/me', {
    username: 'USER1',
    active: true,
    userId: '123456',
    authSource: 'auth',
    name,
  })

const stubUserGroups = userType =>
  stubGet(
    '/manage-users-api/externalusers/123456/groups',
    userType === UserType.COURT
      ? [
          {
            groupCode: 'VIDEO_LINK_COURT_USER',
            groupName: 'Video Link Court User',
          },
        ]
      : [
          {
            groupCode: 'VIDEO_LINK_PROBATION_USER',
            groupName: 'Video Link Probation User',
          },
        ],
  )

export default {
  stubCourtUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.COURT)]),
  stubProbationUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.PROBATION)]),
  stubManageUsersPing: () => stubGet('/manage-users-api/health/ping'),
}
