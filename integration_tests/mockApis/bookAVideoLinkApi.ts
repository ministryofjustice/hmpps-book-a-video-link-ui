import { stubGet, stubPost } from './wiremock'

import enabledCourts from './fixtures/bookAVideoLinkApi/enabledCourts.json'
import enabledProbationTeams from './fixtures/bookAVideoLinkApi/enabledProbationTeams.json'
import enabledPrisons from './fixtures/bookAVideoLinkApi/enabledPrisons.json'
import allPrisons from './fixtures/bookAVideoLinkApi/allPrisons.json'
import courtHearingTypes from './fixtures/bookAVideoLinkApi/courtHearingTypes.json'
import probationMeetingTypes from './fixtures/bookAVideoLinkApi/probationMeetingTypes.json'

const stubGetUserCourtPreferences = (
  jsonBody = [
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
) => stubGet('/book-a-video-link-api/courts/user-preferences', jsonBody)

const stubGetUserProbationTeamPreferences = (
  jsonBody = [
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
) => stubGet('/book-a-video-link-api/probation-teams/user-preferences', jsonBody)

export default {
  stubBookAVideoLinkPing: () => stubGet('/book-a-video-link-api/health/ping'),
  stubGetEnabledCourts: () => stubGet('/book-a-video-link-api/courts/enabled', enabledCourts),
  stubGetUserCourtPreferences,
  stubSetUserCourtPreferences: () => stubPost('/book-a-video-link-api/courts/user-preferences/set'),
  stubGetEnabledProbationTeams: () => stubGet('/book-a-video-link-api/probation-teams/enabled', enabledProbationTeams),
  stubGetUserProbationTeamPreferences,
  stubSetUserProbationTeamPreferences: () => stubPost('/book-a-video-link-api/probation-teams/user-preferences/set'),
  stubAllPrisons: () => stubGet('/book-a-video-link-api/prisons/list\\?enabledOnly=false', allPrisons),
  stubEnabledPrisons: () => stubGet('/book-a-video-link-api/prisons/list\\?enabledOnly=true', enabledPrisons),
  stubPrisonLocations: response => stubGet('/book-a-video-link-api/prisons/(.){3}/locations', response),

  stubCourtHearingTypes: () =>
    stubGet('/book-a-video-link-api/reference-codes/group/COURT_HEARING_TYPE', courtHearingTypes),

  stubProbationMeetingTypes: () =>
    stubGet('/book-a-video-link-api/reference-codes/group/PROBATION_MEETING_TYPE', probationMeetingTypes),

  stubAvailabilityCheck: (response = { availabilityOk: true }) =>
    stubPost('/book-a-video-link-api/availability', response),

  stubCreateBooking: () => stubPost('/book-a-video-link-api/video-link-booking'),
  stubGetBooking: response => stubGet('/book-a-video-link-api/video-link-booking/(.)*', response),
  stubUserPreferences: () => Promise.all([stubGetUserCourtPreferences(), stubGetUserProbationTeamPreferences()]),
}
