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
  locked_by?: string | null
}): { type: 'booking' | 'food'; title: string; message: string } {
  const deviceSubtotal = Number(booking.device_subtotal || 0)
  const foodSubtotal = Number(booking.food_subtotal || 0)
  const total = Number(booking.total_amount || 0)

  const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
  const who = `${booking.customer_name || 'Customer'} • #${booking.booking_number || 'Unknown'}`

  // Says where the order came from, because the desk handles the two differently:
  // a walk-in is standing there, an online order is not.
  const origin = isWalkIn(booking.locked_by) ? 'Walk-In ' : ''

  // Slot and food in one order: say so once, with the split, rather than
  // raising a separate notification for each half.
  if (deviceSubtotal > 0 && foodSubtotal > 0) {
    return {
      type: 'booking',
      title: `New ${origin}Booking + Food Order`,
      message: `${who} • ${rupees(total)} (Slot ${rupees(deviceSubtotal)} + Food ${rupees(foodSubtotal)})`,
    }
  }

  if (foodSubtotal > 0 && deviceSubtotal === 0) {
    return {
      type: 'food',
      title: `New ${origin}Food Order`,
      message: `${who} • ${rupees(total)}`,
    }
  }

  // A walk-in session is billed on the time actually played, so at the moment it
  // is created there is no figure to quote - and quoting the zero that stands in
  // for "not yet known" reads as a free session.
  if (total === 0 && deviceSubtotal === 0 && foodSubtotal === 0) {
    return {
      type: 'booking',
      title: `New ${origin}Booking`,
      message: `${who} • awaiting check-in`,
    }
  }

  return {
    type: 'booking',
    title: `New ${origin}Booking`,
    message: `${who} • ${rupees(total)}`,
  }
}

/**
 * Walk-ins carry no `locked_by`; only the online flows stamp it as 'customer'.
 *
 * This used to decide what the poller ignored, on the grounds that the walk-in
 * screens announce their own. They only announce to the tab that created them -
 * so a walk-in was invisible to every other admin session, vanished on reload,
 * and the "start now" screen never announced at all. The poller now reads walk-ins
 * too and this only affects the wording; stable ids keep the screen's immediate
 * announcement and the poll from being listed twice.
 */
export function isWalkIn(lockedBy: string | null | undefined): boolean {
  return lockedBy !== 'customer'
}

/**
 * The natural key for an order's notification.
 *
 * Shared with the walk-in screens, which announce the same booking the instant
 * they create it. Same booking, same id, one entry in the bell - and the same id
 * again after a reload, so the restored list absorbs the re-poll instead of
 * doubling it.
 */
export function bookingNotificationId(bookingId: string): string {
  return `booking:${bookingId}`
}

/**
 * How far back the first poll looks.
 *
 * Starting from "now" meant anything that happened while the panel was shut, or
 * in the seconds around a reload, was never announced to anyone. Twelve hours
 * covers a shift; older orders are history and the age cap in the store drops
 * them anyway.
 */
const BACKFILL_WINDOW_MS = 12 * 60 * 60 * 1000

/**
 * How far back every later poll reads.
 *
 * Long enough that an order still shows up after the delay between a hold being
 * placed and the payment that turns it into a booking, which is capped at five
 * minutes by `HOLD_DURATION_MS`.
 */
const STEADY_WINDOW_MS = 15 * 60 * 1000

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
  const isFirstPollRef = useRef(true)

  /**
   * Food keeps a moving cursor where bookings need a window.
   *
   * The window exists because a paid booking is an *updated* hold row carrying an
   * older `created_at`. Food rows have no such trick played on them - they are
   * plain inserts, stamped when they happen - so re-reading them buys nothing and
   * costs correctness: these notifications are grouped per booking and keyed on
   * the newest row in the group, so a second helping arriving while the first was
   * still inside the window formed a *different* group with a different key, and
   * announced "Food Added" twice for one order.
   */
  const lastFoodTimeRef = useRef<string | null>(null)

  useEffect(() => {
    /**
     * The stretch of history each poll reads.
     *
     * This replaces a moving "last seen" cursor, which could not be made to work
     * for the main online flow: paying does not insert a booking, it *updates* the
     * hold row that was already there, so a paid booking still carries the
     * `created_at` of the hold placed minutes earlier. Once any other booking had
     * pushed the cursor past that timestamp, the paid one was never announced to
     * anybody. A window that simply re-reads the recent past cannot miss it, and
     * with stable ids re-reading costs nothing: the second sighting of an order is
     * recognised and dropped.
     *
     * The first pass reaches back over the shift, so a reload or a panel that was
     * closed for an hour catches up.
     */
    function windowStart(): string {
      const span = isFirstPollRef.current ? BACKFILL_WINDOW_MS : STEADY_WINDOW_MS
      return new Date(Date.now() - span).toISOString()
    }

    async function checkForNewBookings() {
      try {
        const { data: newBookings, error } = await supabase
          .from('bookings')
          .select(
            'id, booking_number, customer_name, total_amount, device_subtotal, food_subtotal, created_at, locked_by, status'
          )
          .gt('created_at', windowStart())
          // A hold is a station reserved while somebody types their card in, not
          // an order. It becomes one on payment, when status leaves 'locked'.
          .neq('status', 'locked')
          // Walk-ins are included: they are bookings the desk needs announced on
          // every screen, not just the one that typed them in.
          .order('created_at', { ascending: false })

        if (!error && newBookings && newBookings.length > 0) {
          // One notification per order, describing whatever it contains
          newBookings.reverse().forEach((booking: any) => {
            const { type, title, message } = describeOrderNotification(booking)

            addNotification({
              id: bookingNotificationId(booking.id),
              type,
              title,
              message,
              bookingId: booking.id,
              bookingNumber: booking.booking_number,
              // When the order was placed, not when this sweep found it.
              timestamp: new Date(booking.created_at),
            })
          })
        }
      } catch (error) {
        console.error('Error checking for new bookings:', error)
      }
    }

    async function checkForNewFood() {
      // First pass reaches back over the shift, as the booking sweep does.
      if (!lastFoodTimeRef.current) {
        lastFoodTimeRef.current = new Date(Date.now() - BACKFILL_WINDOW_MS).toISOString()
      }

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
          // Nothing back-dates a food row, so everything up to the newest is seen.
          lastFoodTimeRef.current = newFoodItems[0].created_at

          // Food that came with an order is already covered by that order's
          // single notification; only later additions belong here. This holds for
          // walk-ins as much as online orders, so origin no longer decides it.
          const addedToExistingBooking = newFoodItems.filter(
            (item: any) => !arrivedWithOrder(item.bookings?.created_at, item.created_at)
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
                // The newest row in the group keys the notification, so re-reading
                // the same batch after a reload lands on the same id. A genuinely
                // later addition carries a newer stamp and is its own entry.
                latestAt: item.created_at,
              }
            }
            acc[bookingId].items.push(item)
            acc[bookingId].totalAmount += item.quantity * item.unit_price
            if (item.created_at > acc[bookingId].latestAt) {
              acc[bookingId].latestAt = item.created_at
            }
            return acc
          }, {})

          // Add notifications for each booking
          Object.values(bookingGroups).reverse().forEach((group: any) => {
            addNotification({
              id: `food:${group.bookingId}:${group.latestAt}`,
              type: 'food',
              title: 'Food Added',
              message: `${group.customerName} • #${group.bookingNumber} • ${group.items.length} item(s) • ₹${group.totalAmount.toLocaleString('en-IN')} pending`,
              bookingId: group.bookingId,
              bookingNumber: group.bookingNumber,
              timestamp: new Date(group.latestAt),
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
      // Both halves have had their look over the shift; from here the shorter
      // window is enough, and cheaper.
      isFirstPollRef.current = false
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
