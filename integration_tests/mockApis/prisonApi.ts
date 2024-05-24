import { stubFor } from './wiremock'

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prison-api/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubPrisonPing: ping,
}
