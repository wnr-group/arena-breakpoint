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

    // Check user_metadata first, then app_metadata
    const role = user.user_metadata?.role || user.app_metadata?.role

    if (role === 'admin' || role === 'staff') {
      return role as UserRole
    }

    // Default to admin for backward compatibility with existing users
    return 'admin'
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
