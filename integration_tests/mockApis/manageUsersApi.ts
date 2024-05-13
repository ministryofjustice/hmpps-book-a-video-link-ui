import { stubFor } from './wiremock'

const stubUser = (name: string = 'john smith') =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/users/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username: 'USER1',
        active: true,
        userId: '123456',
        name,
      },
    },
  })

const stubUserGroups = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/externalusers/123456/groups',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: [
        {
          groupCode: 'VIDEO_LINK_PROBATION_USER',
          groupName: 'Video Link Probation User',
        },
        {
          groupCode: 'VIDEO_LINK_COURT_USER',
          groupName: 'Video Link Court User',
        },
      ],
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manage-users-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubManageUser: (name = 'john smith') => Promise.all([stubUser(name), stubUserGroups()]),
  stubManageUsersPing: ping,
}
