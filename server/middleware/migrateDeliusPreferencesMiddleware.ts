import type { NextFunction, Request, RequestHandler, Response } from 'express'

import type { Services } from '../services'
import logger from '../../logger'

/**
 * This middleware checks for empty probation team preferences for an nDelius and if so,
 * will try to migrate preferences from an external account with the same email address.
 */
export default function migrateDeliusPreferencesMiddleware({ probationTeamsService }: Services): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user } = res.locals

    if (user?.isProbationUser === true && user?.authSource === 'delius') {
      const currentUserPreferences = await probationTeamsService.getUserPreferences(user)
      if (currentUserPreferences.length === 0) {
        const migrated = await probationTeamsService.migrateDeliusUserPreferences(user)
        logger.info(
          `Migrate preferences for ${user.username}, authSource ${user.authSource} - ${migrated.probationTeamsMigrated} migrated`,
        )
      }
    }

    return next()
  }
}
