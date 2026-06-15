'use client'

import { useEffect, useRef } from 'react'
import { useNotifications, Notification } from '@/lib/contexts/NotificationContext'
import { Gamepad2, UtensilsCrossed, X } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'

export function NotificationToastManager() {
  const { notifications } = useNotifications()
  const shownNotificationsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Show toast for new unread notifications
    notifications.forEach((notification) => {
      if (!notification.read && !shownNotificationsRef.current.has(notification.id)) {
        shownNotificationsRef.current.add(notification.id)
        showNotificationToast(notification)
      }
    })
  }, [notifications])

  return null // This component doesn't render anything
}

function showNotificationToast(notification: Notification) {
  const Icon = notification.type === 'booking' ? Gamepad2 : UtensilsCrossed

  sonnerToast.custom(
    (t) => (
      <div
        className="w-full bg-gradient-to-br from-[#111] via-zinc-950 to-[#111] border-2 border-primary/40 rounded-xl p-4 shadow-[0_0_40px_rgba(255,193,7,0.3)] cursor-pointer hover:border-primary/60 transition-all"
        onClick={() => {
          window.open(`/admin/bookings?id=${notification.bookingId}`, '_blank')
          sonnerToast.dismiss(t)
        }}
      >
        <div className="flex items-start gap-3">
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
            <p className="text-xs text-zinc-400">{notification.message}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              sonnerToast.dismiss(t)
            }}
            className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    ),
    {
      duration: 8000, // 8 seconds
      position: 'bottom-right',
    }
  )
}
