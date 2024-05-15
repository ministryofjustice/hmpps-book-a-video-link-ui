import { Router } from 'express'
import homeRoutes from './journeys/home'
import manageCourtsRoutes from './journeys/manageCourts'
import manageProbationAreasRoutes from './journeys/manageProbationTeams'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const router = Router()

  router.use((req, res, next) => {
    const successMessageFlash = req.flash('successMessage')[0]
    const validationErrorsFlash = req.flash('validationErrors')[0]
    const formResponsesFlash = req.flash('formResponses')[0]

    res.locals.successMessage = successMessageFlash ? JSON.parse(successMessageFlash) : null
    res.locals.validationErrors = validationErrorsFlash ? JSON.parse(validationErrorsFlash) : null
    res.locals.formResponses = formResponsesFlash ? JSON.parse(formResponsesFlash) : null
    next()
  })

  router.use('/', homeRoutes(services))
  router.use('/manage-courts', manageCourtsRoutes(services))
  router.use('/manage-probation-teams', manageProbationAreasRoutes(services))

  return router
}
