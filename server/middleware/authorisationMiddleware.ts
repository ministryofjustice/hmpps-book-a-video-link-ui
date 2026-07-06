import { jwtDecode } from 'jwt-decode'
import type { RequestHandler } from 'express'

import logger from '../../logger'

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    // Authorities in the user token will always be prefixed by ROLE_.
    // Convert any roles passed into this function without a ROLE_ prefix so that we match like for like.
    const authorisedAuthorities = authorisedRoles.map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`))
    if (res.locals?.user?.token) {
      const { authorities: roles = [], auth_source: source = '' } = jwtDecode(res.locals.user.token) as {
        authorities?: string[]
        auth_source?: string
      }

      // Check for an allowed role
      if (authorisedAuthorities.length && !roles.some(role => authorisedAuthorities.includes(role))) {
        // Separately identify nDelius users from their auth source and record a log event we can report upon
        if (source === 'delius') {
          logger.error(`Delius user is missing any BVLS roles`)
        }

        // Redirect to the authorisation error page
        logger.error('User is not authorised to access this')
        return res.redirect('/authError')
      }

      // Authorised users
      return next()
    }

    // User is not logged in / has no token in their session
    req.session.returnTo = req.originalUrl

    return res.redirect('/sign-in')
  }
}
