'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function SessionMonitor() {
  const router = useRouter()
  const hasShownExpiry = useRef(false)

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Session expired or user logged out
        if (!hasShownExpiry.current) {
          hasShownExpiry.current = true
          toast.error('Session Expired', {
            description: 'Your session has expired. Please login again.',
            duration: 5000,
          })
        }
        router.push('/admin/login')
        router.refresh()
      }

      if (event === 'TOKEN_REFRESHED') {
        // Session was successfully refreshed
        console.log('Session refreshed successfully')
      }
    })

    // Check session validity on mount and periodically
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        if (!hasShownExpiry.current) {
          hasShownExpiry.current = true
          toast.error('Session Expired', {
            description: 'Your session has expired. Please login again.',
            duration: 5000,
          })
        }
        router.push('/admin/login')
        router.refresh()
      }
    }

    // Check immediately
    checkSession()

    // Check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [router])

  return null
}
