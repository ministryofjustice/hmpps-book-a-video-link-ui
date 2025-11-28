export type AuthSource = 'external'

/**
 * These are the details that all user types share.
 */
export interface BaseUser {
  authSource: AuthSource
  username: string
  userId: string
  name: string
  displayName: string
  userRoles: string[]
  token: string
}

/**
 * External users are those that have a user account in our External Users
 * database. These accounts are created for users that need access to HMPPS
 * services but have neither NOMIS nor nDelius access.
 */
export interface ExternalUser extends BaseUser {
  authSource: 'external'
}

export type HmppsUser = ExternalUser
