/* eslint-disable no-console */
import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import manageUsersApi from './integration_tests/mockApis/manageUsersApi'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import bookAVideoLinkApi from './integration_tests/mockApis/bookAVideoLinkApi'
import prisonerSearchApi from './integration_tests/mockApis/prisonerSearchApi'
import userPreferencesApi from './integration_tests/mockApis/userPreferencesApi'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        log: message => console.log(message) || null,
        table: message => console.table(message) || null,
        ...auth,
        ...manageUsersApi,
        ...userPreferencesApi,
        ...bookAVideoLinkApi,
        ...prisonerSearchApi,
        ...tokenVerification,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
