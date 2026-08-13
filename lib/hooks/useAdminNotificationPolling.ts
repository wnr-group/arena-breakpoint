'use client'

import { useEffect, useRef } from 'react'
import { useNotifications } from '@/lib/contexts/NotificationContext'
import { supabase } from '@/lib/supabase/client'

/**
 * How close to its booking a food row has to be to have arrived with the order.
 * Payment fulfilment writes the booking and its food rows back to back, so a
 * minute is generous; food added to an existing booking is minutes or hours
 * later and is a genuinely separate event.
 */
const SAME_ORDER_WINDOW_MS = 60 * 1000

/**
 * Describes one customer order in a single notification.
 *
 * An order is one `bookings` row, and its subtotals are written in the same
 * insert as the row itself - so what it contains is known the moment the poller
 * sees it, with no second query and no race against its food rows.
 */
export function describeOrderNotification(booking: {
  customer_name?: string | null
  booking_number?: string | null
  device_subtotal?: number | string | null
  food_subtotal?: number | string | null
  total_amount?: number | string | null
}): { type: 'booking' | 'food'; title: string; message: string } {
  const deviceSubtotal = Number(booking.device_subtotal || 0)
  const foodSubtotal = Number(booking.food_subtotal || 0)
  const total = Number(booking.total_amount || 0)

  const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
  const who = `${booking.customer_name || 'Customer'} • #${booking.booking_number || 'Unknown'}`

  // Slot and food in one order: say so once, with the split, rather than
  // raising a separate notification for each half.
  if (deviceSubtotal > 0 && foodSubtotal > 0) {
    return {
      type: 'booking',
      title: 'New Booking + Food Order',
      message: `${who} • ${rupees(total)} (Slot ${rupees(deviceSubtotal)} + Food ${rupees(foodSubtotal)})`,
    }
  }

  if (foodSubtotal > 0 && deviceSubtotal === 0) {
    return {
      type: 'food',
      title: 'New Food Order',
      message: `${who} • ${rupees(total)}`,
    }
  }

  return {
    type: 'booking',
    title: 'New Booking',
    message: `${who} • ${rupees(total)}`,
  }
}

/**
 * Walk-ins carry no `locked_by`; only the online flows stamp it as 'customer'.
 *
 * The poller ignores them: the walk-in screens raise their own notification the
 * moment the booking is confirmed, so polling for them again 30 seconds later
 * would report the same thing twice.
 */
export function isWalkIn(lockedBy: string | null | undefined): boolean {
  return lockedBy !== 'customer'
}

/**
 * True when food arrived as part of the order that created its booking - which
 * the booking poll already announces on its own. Food added to an existing
 * booking later, at the counter or by the customer, fails this and still gets
 * its own notification.
 */
export function arrivedWithOrder(
  bookingCreatedAt: string | null | undefined,
  foodCreatedAt: string
): boolean {
  if (!bookingCreatedAt) return false

  const bookingTime = new Date(bookingCreatedAt).getTime()
  const foodTime = new Date(foodCreatedAt).getTime()
  if (Number.isNaN(bookingTime) || Number.isNaN(foodTime)) return false

  return Math.abs(foodTime - bookingTime) <= SAME_ORDER_WINDOW_MS
}

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
          .select(
            'id, booking_number, customer_name, total_amount, device_subtotal, food_subtotal, created_at, locked_by'
          )
          .gt('created_at', lastBookingTimeRef.current)
          .eq('locked_by', 'customer') // Walk-ins notify from their own screen
          .order('created_at', { ascending: false })

        if (!error && newBookings && newBookings.length > 0) {
          // Update last seen time
          lastBookingTimeRef.current = newBookings[0].created_at

          // One notification per order, describing whatever it contains
          newBookings.reverse().forEach((booking: any) => {
            const { type, title, message } = describeOrderNotification(booking)

            addNotification({
              type,
              title,
              message,
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
              customer_name,
              created_at,
              locked_by
            )
          `)
          .gt('created_at', lastFoodTimeRef.current)
          .order('created_at', { ascending: false })

        if (!error && newFoodItems && newFoodItems.length > 0) {
          // Update last seen time
          lastFoodTimeRef.current = newFoodItems[0].created_at

          // Food that came with a customer order is already covered by that
          // order's single notification; only later additions belong here.
          const addedToExistingBooking = newFoodItems.filter(
            (item: any) =>
              // Walk-in food is announced by the walk-in screen itself
              !isWalkIn(item.bookings?.locked_by) &&
              !arrivedWithOrder(item.bookings?.created_at, item.created_at)
          )

          // Group by booking_id and create notifications
          const bookingGroups = addedToExistingBooking.reduce((acc: any, item: any) => {
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

    // Bookings first and awaited, so a new order is always announced before any
    // food notification that follows it
    async function poll() {
      await checkForNewBookings()
      await checkForNewFood()
    }

    // Poll every 30 seconds
    const interval = setInterval(poll, 30000) // 30 seconds

    // Initial check after 5 seconds (to avoid checking immediately on page load)
    const initialTimeout = setTimeout(poll, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(initialTimeout)
    }
  }, [addNotification])
}
