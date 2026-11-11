import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js'

if (window.applicationInsightsConnectionString) {
  const clickPluginInstance = new ClickAnalyticsPlugin()
  const clickPluginConfig = {
    autoCapture: true,
    dataTags: {
      useDefaultContentNameOrId: true,
      customDataPrefix: 'data-custom-',
      dntDataTag: 'do-not-track',
    },
    callback: {
      contentName: element => {
        const attribute = element.getAttribute('data-qa')

        // Override the account menu link details from being captured
        if (attribute && attribute.startsWith('header-user-name')) {
          return 'account-menu'
        }

        return element.innerText
      },
    },
  }

  const init = new ApplicationInsights({
    config: {
      connectionString: window.applicationInsightsConnectionString,
      extensions: [clickPluginInstance],
      extensionConfig: {
        [clickPluginInstance.identifier]: clickPluginConfig,
      },
      autoTrackPageVisitTime: true,
    },
  })
  const appInsights = init.loadAppInsights()
  appInsights.addTelemetryInitializer(function (envelope) {
    envelope.tags['ai.cloud.role'] = window.applicationInsightsApplicationName
    envelope.tags['ai.application.ver'] = window.buildNumber

    if (envelope && (envelope.baseType === 'EventData' || envelope.baseType === 'PageviewData')) {
      envelope.baseData.properties = envelope.baseData.properties || {}
    }
  })

  appInsights.setAuthenticatedUserContext(window.authenticatedUser)
  appInsights.trackPageView()
}
