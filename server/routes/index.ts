import { Router } from 'express'
import home from './journeys/home'
import admin from './journeys/admin'
import userPreferences from './journeys/userPreferences'
import bookAVideoLink from './journeys/bookAVideoLink'
import viewBooking from './journeys/viewBooking'
import { Services } from '../services'
import config from '../config'

export default function routes(services: Services): Router {
  const router = Router()
  router.use((req, res, next) =>
    config.maintenance.enabled ? res.render('pages/maintenanceMode', { maintenance: config.maintenance }) : next(),
  )
  router.use('/:type(court|probation)/user-preferences', userPreferences(services))

  // The rest of the routes cannot be accessed unless the user has selected some court or probation team preferences
  router.use(async (req, res, next) => {
    const { user } = res.locals
    const courtPreferences = user.isCourtUser && (await services.courtsService.getUserPreferences(user))
    const probationPreferences = user.isProbationUser && (await services.probationTeamsService.getUserPreferences(user))

    if (user.isCourtUser && courtPreferences.length === 0) return res.redirect('/court/user-preferences')
    if (user.isProbationUser && probationPreferences.length === 0) return res.redirect('/probation/user-preferences')
    return next()
  })

  router.use('/', home(services))
  router.use('/admin', admin(services))
  router.use('/:type(court|probation)/booking', bookAVideoLink(services))
  router.use('/:type(court|probation)/view-booking', viewBooking(services))

  return router
}
