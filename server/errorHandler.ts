import type { NextFunction, Request, Response } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'

interface BadRequest extends HTTPError {
  userMessage: string
}

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(
      `Error handling ${req.method} request for '${req.originalUrl}', user '${res.locals.user?.username}'`,
      error,
    )

    switch (error.status) {
      case 400: {
        const badRequest = JSON.parse(error.text) as BadRequest
        return res.validationFailed('', badRequest?.userMessage)
      }
      case 401:
        logger.info('Logging user out')
        return res.redirect('/sign-out')
      case 404:
        res.status(404)
        return res.render('pages/error/404')
      default: {
        const status = error.status || 500
        res.status(status)

        if (production) {
          return res.render('pages/error/500', {
            url: req.url,
          })
        }

        return res.render('pages/error/error', {
          message: error.message,
          status,
          stack: error.stack,
        })
      }
    }
  }
}
