import { stubFor } from './wiremock'

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/book-a-video-link-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

const stubUserCourtPreferences = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/book-a-video-link-api/courts/user-preferences',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          courtId: 304,
          code: 'ABERCV',
          description: 'Aberystwyth Civil',
          enabled: true,
          notes: null,
        },
        {
          courtId: 305,
          code: 'ABERFC',
          description: 'Aberystwyth Family',
          enabled: true,
          notes: null,
        },
      ],
    },
  })

const stubUserProbationTeamPreferences = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/book-a-video-link-api/probation-teams/user-preferences',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: [
        {
          probationTeamId: 1,
          code: 'BLKPPP',
          description: 'Blackpool MC (PPOC)',
          enabled: true,
          notes: null,
        },
        {
          probationTeamId: 8,
          code: 'BURNPM',
          description: 'Burnley MC (PPOC)',
          enabled: true,
          notes: null,
        },
      ],
    },
  })

export default {
  stubBookAVideoLinkPing: ping,
  stubUserPreferences: () => Promise.all([stubUserCourtPreferences(), stubUserProbationTeamPreferences()]),
}
