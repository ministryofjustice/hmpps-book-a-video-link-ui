import { Router } from 'express'
import createError from 'http-errors'
import type { Services } from '../../../services'
import createRoutes from './createRoutes'
import editRoutes from './editRoutes'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import journeyDataMiddleware from '../../../middleware/journeyDataMiddleware'
import BavlJourneyType from '../../enumerator/bavlJourneyType'
import initialiseEditJourney from './middleware/initialiseEditJourney'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    const { type } = req.params

    return (res.locals.user.isCourtUser && type === BavlJourneyType.COURT) ||
      (res.locals.user.isProbationUser && type === BavlJourneyType.PROBATION)
      ? next()
      : next(createError(404, 'Not found'))
  })

  router.use('/:mode(create)/', insertJourneyIdentifier())
  router.use('/:mode(create)/:journeyId', journeyDataMiddleware('bookAVideoLink'), createRoutes(services))
  router.use('/:mode(edit)/:bookingId', insertJourneyIdentifier())
  router.use(
    '/:mode(edit)/:bookingId/:journeyId',
    journeyDataMiddleware('bookAVideoLink'),
    initialiseEditJourney(services),
    editRoutes(services),
  )

  return router
}
