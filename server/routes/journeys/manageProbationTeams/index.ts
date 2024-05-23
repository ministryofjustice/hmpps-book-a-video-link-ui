import { Router } from 'express'
import createError from 'http-errors'
import type { Services } from '../../../services'
import routes from './routes'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  // The following routes are only accessible to probation users
  router.use((req, res, next) => {
    return res.locals.user.isProbationUser ? next() : next(createError(404, 'Not found'))
  })

  router.use('/', insertJourneyIdentifier())
  router.use('/:journeyId', routes(services))

  return router
}
