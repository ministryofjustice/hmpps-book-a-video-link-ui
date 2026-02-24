import { TelemetryClient } from 'applicationinsights'
import logger from '../../logger'

export default class TelemetryService {
  constructor(private readonly applicationInsightsClient: TelemetryClient | null) {}

  trackEvent(name: string, properties?: { [key: string]: string | number | null | undefined }) {
    if (this.applicationInsightsClient) {
      try {
        this.applicationInsightsClient.trackEvent({
          name,
          properties: {
            ...properties,
          },
        })
      } catch (error) {
        logger.error('Error sending telemetry event, ', error)
      }
    }
  }
}
