/**
 * VIDEO_LINK_COURT_USER - assigned to all court and (current) probation users with external accounts
 * BVLS_ADMIN - additional role assigned to OPVCT admin team and support teams.
 * BVLS_PROBATION - new role assigned to nDelius probation accounts via role-mapping in manage-users-api
 */

enum AuthorisedRoles {
  VIDEO_LINK_COURT_USER = 'ROLE_VIDEO_LINK_COURT_USER',
  BVLS_ADMIN = 'ROLE_BVLS_ADMIN',
  BVLS_PROBATION = 'ROLE_BVLS_PROBATION',
}

export default AuthorisedRoles
