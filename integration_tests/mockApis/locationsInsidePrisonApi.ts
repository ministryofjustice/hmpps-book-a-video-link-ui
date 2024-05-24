import { stubFor } from './wiremock'

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/locations-inside-prison-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubLocationsInsidePrisonPing: ping,
}
