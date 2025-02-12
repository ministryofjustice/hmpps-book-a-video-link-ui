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

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    return res.locals.user.isProbationUser ? next() : next(createError(404, 'Not found'))
  })

  router.use('/:mode(create|request)/', insertJourneyIdentifier())
  router.use('/:mode(create)/:journeyId', journeyDataMiddleware('bookAVideoLink'), createRoutes(services))
  router.use('/:mode(request)/:journeyId', journeyDataMiddleware('bookAVideoLink'), requestRoutes(services))

  router.use('/:mode(amend)/:bookingId', insertJourneyIdentifier())
  router.use(
    '/:mode(amend)/:bookingId/:journeyId',
    journeyDataMiddleware('bookAVideoLink'),
    initialiseJourney(services),
    amendRoutes(services),
  )

  router.use('/:mode(cancel)/:bookingId', insertJourneyIdentifier())
  router.use(
    '/:mode(cancel)/:bookingId/:journeyId',
    journeyDataMiddleware('bookAVideoLink'),
    initialiseJourney(services),
    cancelRoutes(services),
  )

  return router
}
