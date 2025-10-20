import { Router } from 'express'
import createError from 'http-errors'
import type { Services } from '../../../services'
import BavlJourneyType from '../../enumerator/bavlJourneyType'
import routes from './routes'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    const { type } = req.routeContext

    return (res.locals.user.isCourtUser && type === BavlJourneyType.COURT) ||
      (res.locals.user.isProbationUser && type === BavlJourneyType.PROBATION)
      ? next()
      : next(createError(404, 'Not found'))
  })

  router.use('/', routes(services))

  return router
}
