import * as GOVUKFrontend from 'govuk-frontend'
import * as MOJFrontend from '@ministryofjustice/frontend'
import * as BookAVideoLinkFrontend from './all'

// Make GOVUKFrontend And MOJFrontend globally accessible
window.GOVUKFrontend = GOVUKFrontend
window.MOJFrontend = MOJFrontend

GOVUKFrontend.initAll()
MOJFrontend.initAll()
BookAVideoLinkFrontend.initAll()

export default {
  ...BookAVideoLinkFrontend,
}
