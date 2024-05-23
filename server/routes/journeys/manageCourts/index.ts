import { Router } from 'express'
import createError from 'http-errors'
import type { Services } from '../../../services'
import routes from './routes'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  // The following routes are only accessible to court users
  router.use((req, res, next) => {
    return res.locals.user.isCourtUser ? next() : next(createError(404, 'Not found'))
  })

  router.use('/', routes(services))

  return router
}
