import { Router } from 'express'
import createError from 'http-errors'
import type { Services } from '../../../../services'
import routes from './routes'
import insertJourneyIdentifier from '../../../../middleware/insertJourneyIdentifier'
import journeyDataMiddleware from '../../../../middleware/journeyDataMiddleware'
import BavlJourneyType from '../../../enumerator/bavlJourneyType'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    const { type } = req.params

    return (res.locals.user.isCourtUser && type === BavlJourneyType.COURT) ||
      (res.locals.user.isProbationUser && type === BavlJourneyType.PROBATION)
      ? next()
      : next(createError(404, 'Not found'))
  })

  router.use('/', insertJourneyIdentifier())
  router.use('/:journeyId', journeyDataMiddleware('prisonerSearch'), routes(services))

  return router
}
