import { stubGet } from './wiremock'

enum UserType {
  ADMIN = 'ADMIN',
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

const stubUserGroups = userType => {
  let response

  switch (userType) {
    case UserType.COURT:
      response = [
        {
          groupCode: 'VIDEO_LINK_COURT_USER',
          groupName: 'Video Link Court User',
        },
      ]
      break

    case UserType.PROBATION:
      response = [
        {
          groupCode: 'VIDEO_LINK_PROBATION_USER',
          groupName: 'Video Link Probation User',
        },
      ]
      break

    case UserType.ADMIN:
      response = []
      break

    default:
      throw new Error('Unknown user type')
  }

  return stubGet('/manage-users-api/externalusers/123456/groups', response)
}

export default {
  stubAdminUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.ADMIN)]),
  stubCourtUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.COURT)]),
  stubProbationUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.PROBATION)]),
  stubManageUsersPing: () => stubGet('/manage-users-api/health/ping'),
}
