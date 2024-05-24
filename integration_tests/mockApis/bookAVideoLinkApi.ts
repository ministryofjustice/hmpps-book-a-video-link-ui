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

export default {
  stubBookAVideoLinkPing: ping,
}
