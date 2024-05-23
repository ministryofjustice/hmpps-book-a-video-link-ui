import { Router } from 'express'
import home from './journeys/home'
import manageCourts from './journeys/manageCourts'
import manageProbationTeams from './journeys/manageProbationTeams'
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

  router.use('/', home(services))
  router.use('/manage-courts', manageCourts(services))
  router.use('/manage-probation-teams', manageProbationTeams(services))

  return router
}
