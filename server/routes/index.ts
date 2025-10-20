import { Router } from 'express'
import home from './journeys/home'
import admin from './journeys/admin'
import userPreferences from './journeys/userPreferences'
import prisonerSearch from './journeys/bookAVideoLink/prisonerSearch'
import bookAVideoLinkCourt from './journeys/bookAVideoLink/court'
import bookAVideoLinkProbation from './journeys/bookAVideoLink/probation'
import viewBooking from './journeys/viewBooking'
import { Services } from '../services'
import config from '../config'
import insertJourneyTypeContext from '../middleware/insertJourneyTypeContext'

export default function routes(services: Services): Router {
  const router = Router()
  router.use((req, res, next) =>
    config.maintenance.enabled ? res.render('pages/maintenanceMode', { maintenance: config.maintenance }) : next(),
  )
  router.use('/court/user-preferences', insertJourneyTypeContext('court'), userPreferences(services))
  router.use('/probation/user-preferences', insertJourneyTypeContext('probation'), userPreferences(services))

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

  router.use('/court/prisoner-search', insertJourneyTypeContext('court'), prisonerSearch(services))
  router.use('/probation/prisoner-search', insertJourneyTypeContext('probation'), prisonerSearch(services))

  router.use('/court/booking', bookAVideoLinkCourt(services))
  router.use('/probation/booking', bookAVideoLinkProbation(services))

  router.use('/court/view-booking', insertJourneyTypeContext('court'), viewBooking(services))
  router.use('/probation/view-booking', insertJourneyTypeContext('probation'), viewBooking(services))

  return router
}
