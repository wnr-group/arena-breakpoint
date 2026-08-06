'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'booking' | 'food'
  title: string
  message: string
  bookingId: string
  bookingNumber: string
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

/**
 * Window in which the same event is treated as already announced. Two sources
 * feed this list - the walk-in screens announce their own order, and the poller
 * announces what customers do - so one event reaching both would otherwise be
 * listed twice.
 */
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => {
      // Same booking, same headline, moments apart: it is the same event.
      // A later, genuinely different event on that booking ("Food Added" after
      // "New Booking") carries a different title and still comes through.
      const cutoff = Date.now() - DUPLICATE_WINDOW_MS
      const alreadyAnnounced = prev.some(
        existing =>
          existing.bookingId === newNotification.bookingId &&
          existing.title === newNotification.title &&
          existing.timestamp.getTime() >= cutoff
      )

      if (alreadyAnnounced) return prev

      return [newNotification, ...prev].slice(0, 10) // Keep only last 10
    })
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
