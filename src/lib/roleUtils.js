/**
 * roleUtils.js
 * ─────────────────────────────────────────────────────────────────────
 * Role definitions and route utilities.
 */

export const USER_ROLES = {
  CUSTOMER: 'customer',
  OWNER: 'owner',
  ADMIN: 'admin',
}

/**
 * Returns the default dashboard path for a given role.
 */
export function getDashboardPath(role) {
  switch (role) {
    case 'admin':
      return '/dashboard/admin'
    case 'owner':
      return '/dashboard/owner'
    case 'customer':
    default:
      return '/dashboard/customer'
  }
}
