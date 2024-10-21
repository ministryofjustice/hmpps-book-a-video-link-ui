import type { NextFunction, Request, RequestHandler, Response } from 'express'

import asyncMiddleware from './asyncMiddleware'
import type { Services } from '../services'

// TODO: This middleware can be removed after a few weeks from go-live.
//  The purpose of this middleware is to migrate the user's court preferences from user-preferences-api and into the BVLS service
//  As user's log in, if their user preferences are empty in BVLS, the preferences will be fetched from user-preferences-api and saved in BVLS.
//  The number of calls to user-preferences-api will reduce over time as users log in to the new service for the first time. After some time, this
//  middleware can be removed.

export default function populateUserPreferencesMiddleware({
  userService,
  courtsService,
  probationTeamsService,
}: Services): RequestHandler {
  const getUserPreferences = async (user: Express.User) => (await userService.getUserPreferences(user)).items

  return asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals

    const courtPreferences = user.isCourtUser && (await courtsService.getUserPreferences(user))
    const probationPreferences = user.isProbationUser && (await probationTeamsService.getUserPreferences(user))

    if (user.isCourtUser && courtPreferences.length === 0)
      await courtsService.setUserPreferences(await getUserPreferences(user), user)

    if (user.isProbationUser && probationPreferences.length === 0)
      await probationTeamsService.setUserPreferences(await getUserPreferences(user), user)

    return next()
  })
}
