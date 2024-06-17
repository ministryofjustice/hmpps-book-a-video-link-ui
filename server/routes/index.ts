import { Router } from 'express'
import home from './journeys/home'
import manageCourts from './journeys/manageCourts'
import manageProbationTeams from './journeys/manageProbationTeams'
import bookAVideoLink from './journeys/bookAVideoLink'
import viewBooking from './journeys/viewBooking'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const router = Router()

  router.use('/manage-courts', manageCourts(services))
  router.use('/manage-probation-teams', manageProbationTeams(services))

  // The rest of the routes cannot be accessed unless the user has selected some court or probation team preferences
  router.use(async (req, res, next) => {
    const { user } = res.locals
    const courtPreferences = await services.courtsService.getUserPreferences(user)
    const probationTeamPreferences = await services.probationTeamsService.getUserPreferences(user)

    if (user.isCourtUser && courtPreferences.length === 0) return res.redirect('/manage-courts')
    if (user.isProbationUser && probationTeamPreferences.length === 0) return res.redirect('/manage-probation-teams')
    return next()
  })

  router.use('/', home(services))
  router.use('/booking/:type(court|probation)', bookAVideoLink(services))
  router.use('/:type(court|probation)/view-booking', viewBooking(services))

  return router
}
