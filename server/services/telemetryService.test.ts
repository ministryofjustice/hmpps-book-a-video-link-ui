import { TelemetryClient } from 'applicationinsights'
import TelemetryService from './telemetryService'

jest.mock('applicationinsights')

describe('telemetryService', () => {
  const telemetryClient = new TelemetryClient() as jest.Mocked<TelemetryClient>
  const telemetryService = new TelemetryService(telemetryClient)

  it('should send event with all types of properties', () => {
    telemetryService.trackEvent('FOO', { foo: 'bar', x: 0, y: null, z: 1 })

    expect(telemetryClient.trackEvent).toHaveBeenCalledWith({
      name: 'FOO',
      properties: {
        foo: 'bar',
        x: 0,
        y: null,
        z: 1,
      },
    })
  })

  it('should not through an exception if the telemetry service fails', () => {
    telemetryClient.trackEvent.mockImplementation(() => {
      throw Error('Error')
    })

    telemetryService.trackEvent('FOO', { foo: 'bar', x: 0, y: null, z: 1 })

    expect(telemetryClient.trackEvent).toHaveBeenCalled()
  })
})
