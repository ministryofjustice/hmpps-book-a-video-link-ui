import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

enum UserType {
  ADMIN = 'ADMIN',
  COURT = 'COURT',
  PROBATION = 'PROBATION',
  DELIUS_PROBATION = 'DELIUS_PROBATION',
}

const stubUser = (name: string = 'john.smith@somewhere.com') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        username: 'john.smith@somewhere.com',
        active: true,
        userId: '123456',
        authSource: 'auth',
        name,
      },
    },
  })

const stubDeliusUser = (name: string = 'X2222') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        username: 'X2222',
        active: true,
        userId: '123456',
        authSource: 'delius',
        name,
      },
    },
  })

const stubUserGroups = (userType: UserType) => {
  let response: { groupCode: string; groupName: string }[]

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

    case UserType.DELIUS_PROBATION:
    case UserType.ADMIN:
      response = []
      break

    default:
      throw new Error('Unknown user type')
  }

  return stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/externalusers/123456/groups',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })
}

export default {
  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-users-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
  stubAdminUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.ADMIN)]),
  stubCourtUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.COURT)]),
  stubProbationUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups(UserType.PROBATION)]),
  stubDeliusUser: (name = 'john smith') =>
    Promise.all([stubDeliusUser(name), stubUserGroups(UserType.DELIUS_PROBATION)]),
}
