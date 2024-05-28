import express, { Router } from 'express'

export default function setUpFlash(): Router {
  const router = express.Router()

  router.use((req, res, next) => {
    const validationErrors: { field: string; message: string }[] = []
    res.addValidationError = (field: string, message: string): void => {
      validationErrors.push({ field, message })
    }

    res.validationFailed = (field?: string, message?: string): void => {
      if (message) {
        res.addValidationError(field, message)
      }

      req.flash('validationErrors', JSON.stringify(validationErrors))
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect('back')
    }

    res.addSuccessMessage = (heading: string, message?: string) => {
      req.flash('successMessage', JSON.stringify({ heading, message }))
    }

    next()
  })

  router.use((req, res, next) => {
    const successMessageFlash = req.flash('successMessage')[0]
    const validationErrorsFlash = req.flash('validationErrors')[0]
    const formResponsesFlash = req.flash('formResponses')[0]

    res.locals.successMessage = successMessageFlash ? JSON.parse(successMessageFlash) : null
    res.locals.validationErrors = validationErrorsFlash ? JSON.parse(validationErrorsFlash) : null
    res.locals.formResponses = formResponsesFlash ? JSON.parse(formResponsesFlash) : null
    next()
  })

  return router
}
