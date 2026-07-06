import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

import authorisationMiddleware from './authorisationMiddleware'

function createToken(authorities: string[], authSource: string) {
  const payload = {
    user_name: 'USER1',
    scope: ['read', 'write'],
    auth_source: authSource,
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

describe('authorisationMiddleware', () => {
  let req: Request
  const next = jest.fn()

  function createResWithToken({ authorities, authSource }: { authorities: string[]; authSource: string }): Response {
    return {
      locals: {
        user: {
          token: createToken(authorities, authSource),
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return next when no required roles', () => {
    const res = createResWithToken({ authorities: [], authSource: 'nomis' })

    authorisationMiddleware()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when user has no authorised roles', () => {
    const res = createResWithToken({ authorities: [], authSource: 'nomis' })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })

  it('should return next when user has authorised role', () => {
    const res = createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'], authSource: 'nomis' })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should return next when user has authorised role and middleware created with ROLE_ prefix', () => {
    const res = createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'], authSource: 'nomis' })

    authorisationMiddleware(['ROLE_SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect for nDelius users without a required role', () => {
    const res = createResWithToken({ authorities: ['ROLE_SOME_DELIUS_ROLE'], authSource: 'delius' })

    authorisationMiddleware(['ROLE_SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalled()
  })

  it('should return next when user has authorised role for nDelius users', () => {
    const res = createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'], authSource: 'delius' })

    authorisationMiddleware(['ROLE_SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })
})
