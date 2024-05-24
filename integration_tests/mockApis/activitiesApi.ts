import { stubFor } from './wiremock'

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/activities-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubActivitiesPing: ping,
}
