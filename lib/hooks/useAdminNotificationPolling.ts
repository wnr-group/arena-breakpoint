'use client'

import { useEffect, useRef } from 'react'
import { useNotifications } from '@/lib/contexts/NotificationContext'
import { supabase } from '@/lib/supabase/client'

export function useAdminNotificationPolling() {
  const { addNotification } = useNotifications()
  const lastBookingTimeRef = useRef<string | null>(null)
  const lastFoodTimeRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Initialize with current timestamp on first load
    if (!isInitializedRef.current) {
      lastBookingTimeRef.current = new Date().toISOString()
      lastFoodTimeRef.current = new Date().toISOString()
      isInitializedRef.current = true
    }

    async function checkForNewBookings() {
      if (!lastBookingTimeRef.current) return

      try {
        const { data: newBookings, error } = await supabase
          .from('bookings')
          .select('id, booking_number, customer_name, total_amount, created_at, locked_by')
          .gt('created_at', lastBookingTimeRef.current)
          .eq('locked_by', 'customer') // Only customer-created bookings
          .order('created_at', { ascending: false })

        if (!error && newBookings && newBookings.length > 0) {
          // Update last seen time
          lastBookingTimeRef.current = newBookings[0].created_at

          // Add notifications for each new booking
          newBookings.reverse().forEach((booking: any) => {
            addNotification({
              type: 'booking',
              title: 'New Booking',
              message: `${booking.customer_name} • #${booking.booking_number} • ₹${Number(booking.total_amount).toLocaleString('en-IN')}`,
              bookingId: booking.id,
              bookingNumber: booking.booking_number,
            })
          })
        }
      } catch (error) {
        console.error('Error checking for new bookings:', error)
      }
    }

    async function checkForNewFood() {
      if (!lastFoodTimeRef.current) return

      try {
        const { data: newFoodItems, error } = await supabase
          .from('booking_food_items')
          .select(`
            id,
            booking_id,
            quantity,
            unit_price,
            created_at,
            bookings (
              booking_number,
              customer_name
            )
          `)
          .gt('created_at', lastFoodTimeRef.current)
          .order('created_at', { ascending: false })

        if (!error && newFoodItems && newFoodItems.length > 0) {
          // Update last seen time
          lastFoodTimeRef.current = newFoodItems[0].created_at

          // Group by booking_id and create notifications
          const bookingGroups = newFoodItems.reduce((acc: any, item: any) => {
            const bookingId = item.booking_id
            if (!acc[bookingId]) {
              acc[bookingId] = {
                bookingId,
                bookingNumber: item.bookings?.booking_number || 'Unknown',
                customerName: item.bookings?.customer_name || 'Customer',
                items: [],
                totalAmount: 0,
              }
            }
            acc[bookingId].items.push(item)
            acc[bookingId].totalAmount += item.quantity * item.unit_price
            return acc
          }, {})

          // Add notifications for each booking
          Object.values(bookingGroups).reverse().forEach((group: any) => {
            addNotification({
              type: 'food',
              title: 'Food Added',
              message: `${group.customerName} • #${group.bookingNumber} • ${group.items.length} item(s) • ₹${group.totalAmount.toLocaleString('en-IN')} pending`,
              bookingId: group.bookingId,
              bookingNumber: group.bookingNumber,
            })
          })
        }
      } catch (error) {
        console.error('Error checking for new food items:', error)
      }
    }

    // Poll every 30 seconds
    const interval = setInterval(() => {
      checkForNewBookings()
      checkForNewFood()
    }, 30000) // 30 seconds

    // Initial check after 5 seconds (to avoid checking immediately on page load)
    const initialTimeout = setTimeout(() => {
      checkForNewBookings()
      checkForNewFood()
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(initialTimeout)
    }
  }, [addNotification])
}
