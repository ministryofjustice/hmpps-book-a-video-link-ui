import { Router } from 'express'
import createError from 'http-errors'
import type { Services } from '../../../../services'
import createRoutes from './createRoutes'
import requestRoutes from './requestRoutes'
import amendRoutes from './amendRoutes'
import cancelRoutes from './cancelRoutes'
import insertJourneyIdentifier from '../../../../middleware/insertJourneyIdentifier'
import journeyDataMiddleware from '../../../../middleware/journeyDataMiddleware'
import initialiseJourney from './middleware/initialiseJourney'
import insertJourneyModeContext from '../../../../middleware/insertJourneyModeContext'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    return res.locals.user.isCourtUser ? next() : next(createError(404, 'Not found'))
  })

  router.use('/create/', insertJourneyModeContext('create'), insertJourneyIdentifier())
  router.use('/request/', insertJourneyModeContext('request'), insertJourneyIdentifier())

  router.use(
    '/create/:journeyId',
    insertJourneyModeContext('create'),
    journeyDataMiddleware('bookACourtHearing'),
    createRoutes(services),
  )
  router.use(
    '/request/:journeyId',
    insertJourneyModeContext('request'),
    journeyDataMiddleware('bookACourtHearing'),
    requestRoutes(services),
  )

  router.use('/amend/:bookingId', insertJourneyModeContext('amend'), insertJourneyIdentifier())
  router.use(
    '/amend/:bookingId/:journeyId',
    insertJourneyModeContext('amend'),
    journeyDataMiddleware('bookACourtHearing'),
    initialiseJourney(services),
    amendRoutes(services),
  )

  router.use('/cancel/:bookingId', insertJourneyModeContext('cancel'), insertJourneyIdentifier())
  router.use(
    '/cancel/:bookingId/:journeyId',
    insertJourneyModeContext('cancel'),
    journeyDataMiddleware('bookACourtHearing'),
    initialiseJourney(services),
    cancelRoutes(services),
  )

  return router
}
