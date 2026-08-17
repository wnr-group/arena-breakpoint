'use client'

import { useEffect, useRef } from 'react'
import { useNotifications, Notification } from '@/lib/contexts/NotificationContext'
import { Gamepad2, UtensilsCrossed, X } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'
import { playNotificationSound, preloadNotificationSound } from '@/lib/utils/notificationSound'

export function NotificationToastManager() {
  const { notifications, hydrated } = useNotifications()
  const shownNotificationsRef = useRef<Set<string>>(new Set())
  const seededRef = useRef(false)

  useEffect(() => {
    // Preload notification sound on mount
    preloadNotificationSound()
  }, [])

  useEffect(() => {
    // Nothing is new until the stored list has been read back.
    if (!hydrated) return

    /**
     * Whatever was restored from the last session is not news.
     *
     * This ref is per mount, so once notifications survive a reload every unread
     * one looked new again - a page refresh fired a stack of toasts and a chime
     * for each, for orders staff had already seen. Recording them as shown
     * without announcing them leaves the bell holding its history while only
     * genuine arrivals interrupt anyone.
     */
    if (!seededRef.current) {
      seededRef.current = true
      notifications.forEach((notification) => shownNotificationsRef.current.add(notification.id))
      return
    }

    // Show toast for new unread notifications
    notifications.forEach((notification) => {
      if (!notification.read && !shownNotificationsRef.current.has(notification.id)) {
        shownNotificationsRef.current.add(notification.id)
        showNotificationToast(notification)
        // Play notification sound
        playNotificationSound()
      }
    })
  }, [notifications, hydrated])

  return null // This component doesn't render anything
}

function showNotificationToast(notification: Notification) {
  const Icon = notification.type === 'booking' ? Gamepad2 : UtensilsCrossed

  sonnerToast.custom(
    (t) => (
      <div
        className="relative w-full bg-gradient-to-br from-[#111] via-zinc-950 to-[#111] border-2 border-primary/40 rounded-xl p-4 shadow-[0_0_40px_rgba(184,134,11,0.3)] cursor-pointer hover:border-primary/60 transition-all"
        onClick={() => {
          window.open(`/admin/bookings?id=${notification.bookingId}`, '_blank')
          sonnerToast.dismiss(t)
        }}
      >
        {/* Pinned to the card's top-right corner, matching the styled toasts */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            sonnerToast.dismiss(t)
          }}
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 rounded-lg p-1 text-secondary-content transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* pr-6 keeps the message clear of the close button */}
        <div className="flex items-start gap-3 pr-6">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              notification.type === 'booking'
                ? 'bg-primary/20 text-primary'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-white mb-1">{notification.title}</h4>
            <p className="text-xs text-muted-content">{notification.message}</p>
          </div>
        </div>
      </div>
    ),
    {
      duration: 8000, // 8 seconds
      position: 'bottom-right',
    }
  )
}
