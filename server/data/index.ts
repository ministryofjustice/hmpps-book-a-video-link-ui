/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
const applicationInsightsClient = buildAppInsightsClient(applicationInfo)

import ManageUsersApiClient from './manageUsersApiClient'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import PrisonerOffenderSearchApiClient from './prisonerOffenderSearchApiClient'

export const dataAccess = () => ({
  applicationInfo,
  manageUsersApiClient: new ManageUsersApiClient(),
  bookAVideoLinkApiClient: new BookAVideoLinkApiClient(),
  prisonerOffenderSearchApiClient: new PrisonerOffenderSearchApiClient(),
  applicationInsightsClient,
})

export type DataAccess = ReturnType<typeof dataAccess>

export { ManageUsersApiClient }
