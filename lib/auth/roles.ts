/**
 * Role-based access control utilities
 *
 * Roles:
 * - admin: Full access to all pages including Reports
 * - staff: Access to all pages EXCEPT Reports
 */

import { supabase } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'staff' | null

export async function getUserRole(): Promise<UserRole> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // app_metadata ONLY. user_metadata is writable by the user themselves via
    // supabase.auth.updateUser({ data: { role: 'admin' } }), so reading it here
    // would let any signed-in staff member promote themselves.
    const role = user.app_metadata?.role

    if (role === 'admin' || role === 'staff') {
      return role as UserRole
    }

    // No default. This previously returned 'admin' for any account without role
    // metadata, which - combined with public signup - made every authenticated
    // user an administrator.
    return null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

export function canAccessReports(role: UserRole): boolean {
  return role === 'admin'
}

export async function checkReportsAccess(): Promise<boolean> {
  const role = await getUserRole()
  return canAccessReports(role)
}
