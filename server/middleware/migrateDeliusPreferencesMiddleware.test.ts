import type { Request, Response } from 'express'

import jwt from 'jsonwebtoken'
import migrateDeliusPreferencesMiddleware from './migrateDeliusPreferencesMiddleware'
import ProbationTeamsService from '../services/probationTeamsService'
import { userPreferencesProbation } from '../routes/testutils/adminTestUtils'
import { Services } from '../services'
import { MigratedProbationTeamPreferencesResponse } from '../@types/bookAVideoLinkApi/types'

jest.mock('../services/probationTeamsService')

describe('migrateDeliusPreferencesMiddleware', () => {
  const probationTeamsService = new ProbationTeamsService(null) as jest.Mocked<ProbationTeamsService>

  beforeEach(() => {
    probationTeamsService.getUserPreferences.mockResolvedValue(userPreferencesProbation())
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  let req: Request
  const next = jest.fn()

  function createToken(authorities: string[], authSource: string) {
    const payload = {
      user_name: 'username',
      scope: ['read', 'write'],
      auth_source: authSource,
      authorities,
      jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
      client_id: 'clientid',
    }

    return jwt.sign(payload, 'secret', { expiresIn: '1h' })
  }

  function createResWithToken({
    authorities,
    authSource,
    isProbationUser = false,
    isDeliusUser = false,
    isCourtUser = false,
  }: {
    authorities: string[]
    authSource: string
    isProbationUser?: boolean
    isDeliusUser?: boolean
    isCourtUser?: boolean
  }): Response {
    return {
      locals: {
        user: {
          token: createToken(authorities, authSource),
          username: 'username',
          authSource,
          isProbationUser,
          isDeliusUser,
          isCourtUser,
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  it('should return next when user is not a probation user', async () => {
    const res = createResWithToken({ authorities: [], authSource: 'auth', isCourtUser: true })

    // Leave the await keyword - despite IJ warning - it is needed
    await migrateDeliusPreferencesMiddleware({ probationTeamsService } as unknown as Services)(req, res, next)

    expect(probationTeamsService.getUserPreferences).not.toHaveBeenCalled()
    expect(probationTeamsService.migrateDeliusUserPreferences).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should return next when user is a probation user but not an nDelius account', async () => {
    const res = createResWithToken({ authorities: [], authSource: 'auth', isProbationUser: true })

    // Leave the await keyword - despite IJ warning - it is needed
    await migrateDeliusPreferencesMiddleware({ probationTeamsService } as unknown as Services)(req, res, next)

    expect(probationTeamsService.getUserPreferences).not.toHaveBeenCalled()
    expect(probationTeamsService.migrateDeliusUserPreferences).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should return next when team preferences already exist for this nDelius user', async () => {
    const res = createResWithToken({ authorities: [], authSource: 'delius', isProbationUser: true })

    // Leave the await keyword - despite IJ warning - it is needed
    await migrateDeliusPreferencesMiddleware({ probationTeamsService } as unknown as Services)(req, res, next)

    expect(probationTeamsService.getUserPreferences).toHaveBeenCalled()
    expect(probationTeamsService.migrateDeliusUserPreferences).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should migrate preferences from a matching external account', async () => {
    const res = createResWithToken({ authorities: [], authSource: 'delius', isProbationUser: true, isDeliusUser: true })

    // No teams currently in the user's preferences
    probationTeamsService.getUserPreferences.mockResolvedValue([])
    probationTeamsService.migrateDeliusUserPreferences.mockResolvedValue({
      probationTeamsMigrated: 2,
    } as MigratedProbationTeamPreferencesResponse)

    // Leave the await keyword - despite IJ warning - it is needed
    await migrateDeliusPreferencesMiddleware({ probationTeamsService } as unknown as Services)(req, res, next)

    expect(probationTeamsService.getUserPreferences).toHaveBeenCalled()
    expect(probationTeamsService.migrateDeliusUserPreferences).toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
