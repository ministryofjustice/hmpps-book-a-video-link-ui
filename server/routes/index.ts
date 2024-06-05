import { Router } from 'express'
import home from './journeys/home'
import manageCourts from './journeys/manageCourts'
import manageProbationTeams from './journeys/manageProbationTeams'
import bookAVideoLink from './journeys/bookAVideoLink'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const router = Router()

  router.use('/', home(services))
  router.use('/manage-courts', manageCourts(services))
  router.use('/manage-probation-teams', manageProbationTeams(services))
  router.use('/booking/:type(court|probation)/create', bookAVideoLink(services))

  return router
}
