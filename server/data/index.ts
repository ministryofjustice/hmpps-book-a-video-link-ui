/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import ManageUsersApiClient from './manageUsersApiClient'
import config from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'

export const dataAccess = () => ({
  applicationInfo,
  manageUsersApiClient: new ManageUsersApiClient(),
  hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
  bookAVideoLinkApiClient: new BookAVideoLinkApiClient(),
})

export type DataAccess = ReturnType<typeof dataAccess>

export { ManageUsersApiClient, HmppsAuditClient }
