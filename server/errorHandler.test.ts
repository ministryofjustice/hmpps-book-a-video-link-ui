import type { Express, Request, Response } from 'express'
import request from 'supertest'
import { HTTPError } from 'superagent'
import { appWithAllRoutes } from './routes/testutils/appSetup'

import createErrorHandler from './errorHandler'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

describe('Error handler', () => {
  beforeEach(() => {
    app = appWithAllRoutes({})
  })

  describe('GET 404', () => {
    it('should render content with stack in dev mode', () => {
      return request(app)
        .get('/unknown')
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
        })
    })
  })

  describe('Other statuses', () => {
    let req: Request
    let res: Response
    let error: HTTPError

    beforeEach(() => {
      req = {
        url: 'http://localhost:3000',
        flash: jest.fn(),
      } as unknown as Request

      res = {
        redirect: jest.fn(),
        render: jest.fn(),
        status: jest.fn(),
        locals: {
          user: {
            username: 'user',
          },
        },
        validationFailed: jest.fn(),
      } as unknown as Response
    })

    it('should log user out if error is 401', () => {
      const handler = createErrorHandler(false)

      error = {
        status: 401,
      } as HTTPError

      handler(error, req, res, jest.fn)

      expect(res.redirect).toHaveBeenCalledWith('/sign-out')
    })

    it('should display error if 403', () => {
      const handler = createErrorHandler(false)

      error = {
        status: 403,
        message: 'forbidden',
      } as HTTPError

      handler(error, req, res, jest.fn)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.render).toHaveBeenCalledWith('pages/error/error', {
        message: 'forbidden',
        stack: undefined,
        status: 403,
      })
    })

    it('should add 400 messages to flash validation messages and redirect back', () => {
      const handler = createErrorHandler(false)

      error = {
        status: 400,
        text: JSON.stringify({
          userMessage: 'User friendly message',
        }),
      } as HTTPError

      handler(error, req, res, jest.fn)

      expect(res.validationFailed).toHaveBeenCalledWith('', 'User friendly message')
    })

    it('should render error page with stacktrace if not in production', () => {
      const handler = createErrorHandler(false)

      error = {
        status: 500,
        message: 'internal server error',
        stack: 'stacktrace',
      } as HTTPError

      handler(error, req, res, jest.fn)

      expect(res.render).toHaveBeenCalledWith('pages/error/error', {
        message: 'internal server error',
        status: 500,
        stack: 'stacktrace',
      })
      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('should render error page with error message if in production', () => {
      const handler = createErrorHandler(true)

      error = {
        status: 500,
        message: 'internal server error',
        stack: 'stacktrace',
      } as HTTPError

      handler(error, req, res, jest.fn)

      expect(res.render).toHaveBeenCalledWith('pages/error/500', { url: 'http://localhost:3000' })
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
