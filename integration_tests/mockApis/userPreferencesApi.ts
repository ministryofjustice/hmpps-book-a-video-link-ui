import { stubGet } from './wiremock'

export default {
  stubGetUserPreferences: () =>
    stubGet('/user-preferences-api/users/(.)*/preferences/video_link_booking.preferred_courts', { items: [] }),
}
