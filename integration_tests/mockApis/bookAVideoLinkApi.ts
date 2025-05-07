import { stubDelete, stubFileStream, stubGet, stubPost, stubPut } from './wiremock'

import enabledCourts from './fixtures/bookAVideoLinkApi/enabledCourts.json'
import enabledProbationTeams from './fixtures/bookAVideoLinkApi/enabledProbationTeams.json'
import enabledPrisons from './fixtures/bookAVideoLinkApi/enabledPrisons.json'
import allPrisons from './fixtures/bookAVideoLinkApi/allPrisons.json'
import courtHearingTypes from './fixtures/bookAVideoLinkApi/courtHearingTypes.json'
import probationMeetingTypes from './fixtures/bookAVideoLinkApi/probationMeetingTypes.json'
import { formatDate } from '../../server/utils/utils'

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

const stubCourtDataExtractByBookingDate = () =>
  stubFileStream(
    '/book-a-video-link-api/download-csv/court-data-by-booking-date\\?(.)*',
    'courtDataExtractByBookingDate.csv',
  )

const stubCourtDataExtractByHearingDate = () =>
  stubFileStream(
    '/book-a-video-link-api/download-csv/court-data-by-hearing-date\\?(.)*',
    'courtDataExtractByHearingDate.csv',
  )

const stubProbationDataExtractByBookingDate = () =>
  stubFileStream(
    '/book-a-video-link-api/download-csv/probation-data-by-booking-date\\?(.)*',
    'probationDataExtractByBookingDate.csv',
  )

const stubProbationDataExtractByMeetingDate = () =>
  stubFileStream(
    '/book-a-video-link-api/download-csv/probation-data-by-meeting-date\\?(.)*',
    'probationDataExtractByMeetingDate.csv',
  )

export default {
  stubBookAVideoLinkPing: () => stubGet('/book-a-video-link-api/health/ping'),
  stubGetEnabledCourts: () => stubGet('/book-a-video-link-api/courts\\?enabledOnly=true', enabledCourts),
  stubGetUserCourtPreferences,
  stubSetUserCourtPreferences: () => stubPost('/book-a-video-link-api/courts/user-preferences/set'),
  stubGetEnabledProbationTeams: () =>
    stubGet('/book-a-video-link-api/probation-teams\\?enabledOnly=true', enabledProbationTeams),
  stubGetUserProbationTeamPreferences,
  stubSetUserProbationTeamPreferences: () => stubPost('/book-a-video-link-api/probation-teams/user-preferences/set'),
  stubAllPrisons: () => stubGet('/book-a-video-link-api/prisons/list\\?enabledOnly=false', allPrisons),
  stubEnabledPrisons: () => stubGet('/book-a-video-link-api/prisons/list\\?enabledOnly=true', enabledPrisons),
  stubPrisonLocations: response => stubGet('/book-a-video-link-api/prisons/(.){3}/locations?(.)*', response),
  stubPostRoomsByDateAndTime: response => stubPost('/book-a-video-link-api/availability/by-date-and-time', response),

  stubCourtHearingTypes: () =>
    stubGet('/book-a-video-link-api/reference-codes/group/COURT_HEARING_TYPE', courtHearingTypes),

  stubProbationMeetingTypes: () =>
    stubGet('/book-a-video-link-api/reference-codes/group/PROBATION_MEETING_TYPE', probationMeetingTypes),

  stubAvailabilityCheck: (response = { availabilityOk: true }) =>
    stubPost('/book-a-video-link-api/availability', response),

  stubAvailableLocations: response => stubPost('/book-a-video-link-api/availability/by-time-slot', response),

  stubCreateBooking: () => stubPost('/book-a-video-link-api/video-link-booking'),
  stubRequestBooking: () => stubPost('/book-a-video-link-api/video-link-booking/request'),
  stubUpdateBooking: () => stubPut('/book-a-video-link-api/video-link-booking/(.)*'),
  stubCancelBooking: () => stubDelete('/book-a-video-link-api/video-link-booking/(.)*'),
  stubGetBooking: response => stubGet('/book-a-video-link-api/video-link-booking/(.)*', response),
  stubUserPreferences: () => Promise.all([stubGetUserCourtPreferences(), stubGetUserProbationTeamPreferences()]),
  stubGetCourtSchedule: ({ courtCode, date, response } = { courtCode: '(.)*', date: undefined, response: [] }) =>
    stubGet(
      `/book-a-video-link-api/schedule/court/${courtCode}${date ? `\\?date=${formatDate(date, 'yyyy-MM-dd')}` : ''}`,
      response,
    ),
  stubGetProbationTeamSchedule: (
    { probationTeamCode, date, response } = { probationTeamCode: '(.)*', date: undefined, response: [] },
  ) =>
    stubGet(
      `/book-a-video-link-api/schedule/probation/${probationTeamCode}${date ? `\\?date=${formatDate(date, 'yyyy-MM-dd')}` : ''}`,
      response,
    ),
  stubCourtDataExtractByBookingDate,
  stubCourtDataExtractByHearingDate,
  stubProbationDataExtractByBookingDate,
  stubProbationDataExtractByMeetingDate,
}
