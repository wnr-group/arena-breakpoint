import { supabaseAdmin } from '@/lib/supabase/server'
import { findApplicableHappyHour, type HappyHourRule } from '@/lib/happy-hours'
import { calculateEndTime, formatTo24Hour } from '@/lib/utils/timeSlots'
import { countAvailableDevicesForRange, toRequestedRange } from './availability'

/**
 * Server-authoritative pricing.
 *
 * The browser sends *what* the customer wants (device type, slot, duration,
 * players, cart, promo code) but never *how much* it costs. Rates, item prices,
 * happy-hour rules, subscription tiers and promo values are all re-read from the
 * database here, so a tampered client cannot pay less than the real price.
 */

const MIN_DURATION_MINUTES = 30
const MAX_DURATION_MINUTES = 5 * 60

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export interface CustomerDetails {
  phone: string
  name: string
  email: string | null
  dateOfBirth: string | null
}

export interface QuotedAddon {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  lineTotal: number
}

export interface DeviceBookingQuote {
  kind: 'device_booking'
  customer: CustomerDetails

  deviceTypeId: string
  deviceTypeName: string

  selectedDate: string
  slotLabel: string
  slotStartTime12: string
  slotEndTime12: string
  slotStartTime24: string
  slotEndTime24: string
  durationMinutes: number
  durationHours: number

  hourlyRate: number
  playerCount: number
  includedPlayers: number
  extraPlayerCharge: number

  deviceCharges: number
  extraPlayersCount: number
  extraPlayersTotal: number
  deviceSubtotal: number

  addons: QuotedAddon[]
  addonsTotal: number

  subscriptionId: string | null
  subscriptionDiscount: number

  promoCode: string | null
  promoCodeId: string | null
  promoDiscount: number

  happyHourRuleId: string | null
  happyHourRuleName: string | null
  happyHourDiscount: number

  totalAmount: number
}

export interface FoodOrderQuote {
  kind: 'food_order'
  customer: CustomerDetails
  items: QuotedAddon[]
  itemsTotal: number
  promoCode: string | null
  promoCodeId: string | null
  promoDiscount: number
  totalAmount: number
}

export type QuoteResult<T> =
  | { success: true; quote: T }
  | { success: false; error: string }

// ================================================
// Shared lookups
// ================================================

function normaliseCustomer(input: {
  phone: string
  name: string
  email?: string | null
  dateOfBirth?: string | null
}): CustomerDetails | null {
  const phone = (input.phone || '').trim()
  const name = (input.name || '').trim()

  if (!/^\d{10}$/.test(phone)) return null
  if (!name) return null

  return {
    phone,
    name,
    email: input.email?.trim() || null,
    dateOfBirth: input.dateOfBirth?.trim() || null,
  }
}

/** Priced from `menu_items` - the client's price field is ignored entirely. */
async function priceItems(
  requested: Array<{ id: string; quantity: number }>
): Promise<{ items: QuotedAddon[]; total: number } | { error: string }> {
  if (requested.length === 0) return { items: [], total: 0 }

  for (const item of requested) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { error: 'Invalid item quantity' }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('menu_items')
    .select('id, name, category, price, status, quantity')
    .in(
      'id',
      requested.map((item) => item.id)
    )

  if (error) return { error: 'Could not price your items. Please try again.' }

  const items: QuotedAddon[] = []
  let total = 0

  for (const requestedItem of requested) {
    const menuItem = (data || []).find((row: any) => row.id === requestedItem.id)

    if (!menuItem) {
      return { error: 'One or more items are no longer on the menu.' }
    }

    if (menuItem.status !== 'available') {
      return { error: `${menuItem.name} is currently unavailable.` }
    }

    if (Number(menuItem.quantity) < requestedItem.quantity) {
      return {
        error: `${menuItem.name} is out of stock (only ${menuItem.quantity} left).`,
      }
    }

    const price = Number(menuItem.price)
    const lineTotal = round2(price * requestedItem.quantity)

    items.push({
      id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price,
      quantity: requestedItem.quantity,
      lineTotal,
    })

    total += lineTotal
  }

  return { items, total: round2(total) }
}

/**
 * Re-validates a promo code and recomputes its value against `discountableBase`.
 * An invalid code is not an error - it simply contributes no discount, matching
 * how the booking screens behave.
 */
async function resolvePromoDiscount(
  code: string | null | undefined,
  discountableBase: number
): Promise<{ promoCode: string | null; promoCodeId: string | null; promoDiscount: number }> {
  const none = { promoCode: null, promoCodeId: null, promoDiscount: 0 }

  if (!code || !code.trim()) return none

  const { data: promo, error } = await supabaseAdmin
    .from('promo_codes')
    .select(
      'id, code, discount_type, discount_value, is_active, valid_from, valid_until, max_uses, uses_count'
    )
    .ilike('code', code.trim())
    .single()

  if (error || !promo || !promo.is_active) return none

  const now = new Date()
  if (now < new Date(promo.valid_from) || now > new Date(promo.valid_until)) {
    return none
  }

  // Fully redeemed. Checked here so the customer is never charged a discounted
  // price we then cannot honour; the redemption itself is claimed atomically at
  // fulfilment time.
  if (promo.max_uses !== null && Number(promo.uses_count) >= Number(promo.max_uses)) {
    return none
  }

  const discountValue = Number(promo.discount_value)
  let discount = 0

  if (promo.discount_type === 'percentage') {
    discount = (discountableBase * discountValue) / 100
  } else if (promo.discount_type === 'fixed') {
    discount = Math.min(discountValue, discountableBase)
  }

  return {
    promoCode: promo.code,
    promoCodeId: promo.id,
    promoDiscount: round2(Math.max(0, discount)),
  }
}

/** Active subscription discount percentage for a phone number, or 0. */
async function resolveSubscription(
  phone: string
): Promise<{ subscriptionId: string | null; discountPercentage: number }> {
  const none = { subscriptionId: null, discountPercentage: 0 }

  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('active_subscription_id')
    .eq('phone', phone)
    .single()

  if (error || !customer?.active_subscription_id) return none

  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, end_date, status, subscription_plan:subscription_plans(discount_percentage)')
    .eq('id', customer.active_subscription_id)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .single()

  if (subError || !subscription) return none

  const percentage = Number((subscription as any).subscription_plan?.discount_percentage || 0)

  return {
    subscriptionId: subscription.id,
    discountPercentage: Number.isFinite(percentage) ? percentage : 0,
  }
}

/** Weekday-correct regardless of server timezone (local midnight, not UTC). */
function parseDateLocal(dateString: string): Date | null {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return Number.isNaN(date.getTime()) ? null : date
}

async function resolveHappyHour(
  deviceTypeDisplayName: string,
  deviceTypeName: string,
  bookingDate: Date,
  slotStart12: string,
  slotEnd12: string,
  discountableBase: number
): Promise<{ ruleId: string | null; ruleName: string | null; discount: number }> {
  const none = { ruleId: null, ruleName: null, discount: 0 }

  const { data, error } = await supabaseAdmin
    .from('happy_hour_rules')
    .select('*')
    .eq('status', 'LIVE')

  // Happy hours are optional - a missing table or query failure must not block payment.
  if (error || !data || data.length === 0) return none

  const rules = data as HappyHourRule[]

  // The booking screens match on display_name; fall back to the internal name.
  const rule =
    findApplicableHappyHour(rules, deviceTypeDisplayName, bookingDate, slotStart12, slotEnd12) ||
    findApplicableHappyHour(rules, deviceTypeName, bookingDate, slotStart12, slotEnd12)

  if (!rule) return none

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    discount: round2((discountableBase * Number(rule.discount)) / 100),
  }
}

// ================================================
// Device booking quote
// ================================================

export interface DeviceBookingInput {
  phone: string
  name: string
  email?: string | null
  dateOfBirth?: string | null

  deviceTypeId: string
  selectedDate: string // YYYY-MM-DD
  slotStartTime: string // "10:00 AM"
  durationMinutes: number
  playerCount: number

  addons?: Array<{ id: string; quantity: number }>
  promoCode?: string | null
}

export async function quoteDeviceBooking(
  input: DeviceBookingInput
): Promise<QuoteResult<DeviceBookingQuote>> {
  try {
    const customer = normaliseCustomer(input)
    if (!customer) {
      return { success: false, error: 'Please provide a valid 10-digit phone number and name.' }
    }

    const bookingDate = parseDateLocal(input.selectedDate)
    if (!bookingDate) {
      return { success: false, error: 'Please select a valid booking date.' }
    }

    const durationMinutes = Number(input.durationMinutes)
    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes < MIN_DURATION_MINUTES ||
      durationMinutes > MAX_DURATION_MINUTES ||
      durationMinutes % MIN_DURATION_MINUTES !== 0
    ) {
      return { success: false, error: 'Please select a valid booking duration.' }
    }

    const slotStartTime24 = formatTo24Hour(input.slotStartTime)
    if (!/^\d{2}:\d{2}$/.test(slotStartTime24)) {
      return { success: false, error: 'Please select a valid start time.' }
    }

    const slotEndTime12 = calculateEndTime(input.slotStartTime, durationMinutes)
    const slotEndTime24 = formatTo24Hour(slotEndTime12)

    // --- Device type: rates come from the database, never the client ---
    const { data: deviceType, error: deviceTypeError } = await supabaseAdmin
      .from('device_types')
      .select(
        'id, name, display_name, regular_hourly_rate, included_players, max_players, extra_player_charge, is_active'
      )
      .eq('id', input.deviceTypeId)
      .single()

    if (deviceTypeError || !deviceType || !deviceType.is_active) {
      return { success: false, error: 'That device type is no longer available.' }
    }

    const playerCount = Number(input.playerCount)
    const includedPlayers = Number(deviceType.included_players) || 1
    const maxPlayers = Number(deviceType.max_players) || includedPlayers

    if (!Number.isInteger(playerCount) || playerCount < 1 || playerCount > maxPlayers) {
      return { success: false, error: `Please select between 1 and ${maxPlayers} players.` }
    }

    // --- Capacity: confirm a station is actually free before charging ---
    const requestedRange = toRequestedRange(slotStartTime24, durationMinutes)
    const availableCount = await countAvailableDevicesForRange(
      deviceType.id,
      input.selectedDate,
      requestedRange
    )

    if (availableCount <= 0) {
      return {
        success: false,
        error: 'That time slot has just been taken. Please pick another slot.',
      }
    }

    // --- Charges ---
    const durationHours = durationMinutes / 60
    const hourlyRate = Number(deviceType.regular_hourly_rate) || 0
    const extraPlayerCharge = Number(deviceType.extra_player_charge) || 0

    const deviceCharges = round2(hourlyRate * durationHours)
    const extraPlayersCount = Math.max(0, playerCount - includedPlayers)
    const extraPlayersTotal = round2(extraPlayersCount * extraPlayerCharge * durationHours)
    const deviceSubtotal = round2(deviceCharges + extraPlayersTotal)

    const pricedAddons = await priceItems(input.addons || [])
    if ('error' in pricedAddons) {
      return { success: false, error: pricedAddons.error }
    }

    // --- Discounts: all three stack on device + extra players, never on food ---
    const discountableBase = deviceSubtotal

    const subscription = await resolveSubscription(customer.phone)
    const subscriptionDiscount = round2(
      (discountableBase * subscription.discountPercentage) / 100
    )

    const happyHour = await resolveHappyHour(
      deviceType.display_name,
      deviceType.name,
      bookingDate,
      input.slotStartTime,
      slotEndTime12,
      discountableBase
    )

    const promo = await resolvePromoDiscount(input.promoCode, discountableBase)

    // Discounts can never exceed the charges they apply to.
    const totalDiscount = Math.min(
      round2(subscriptionDiscount + happyHour.discount + promo.promoDiscount),
      discountableBase
    )

    const totalAmount = round2(
      Math.max(0, deviceSubtotal + pricedAddons.total - totalDiscount)
    )

    return {
      success: true,
      quote: {
        kind: 'device_booking',
        customer,

        deviceTypeId: deviceType.id,
        deviceTypeName: deviceType.display_name,

        selectedDate: input.selectedDate,
        slotLabel: `${input.slotStartTime} - ${slotEndTime12}`,
        slotStartTime12: input.slotStartTime,
        slotEndTime12,
        slotStartTime24,
        slotEndTime24,
        durationMinutes,
        durationHours,

        hourlyRate,
        playerCount,
        includedPlayers,
        extraPlayerCharge,

        deviceCharges,
        extraPlayersCount,
        extraPlayersTotal,
        deviceSubtotal,

        addons: pricedAddons.items,
        addonsTotal: pricedAddons.total,

        subscriptionId: subscription.subscriptionId,
        subscriptionDiscount,

        promoCode: promo.promoCode,
        promoCodeId: promo.promoCodeId,
        promoDiscount: promo.promoDiscount,

        happyHourRuleId: happyHour.ruleId,
        happyHourRuleName: happyHour.ruleName,
        happyHourDiscount: happyHour.discount,

        totalAmount,
      },
    }
  } catch (err: any) {
    console.error('quoteDeviceBooking error:', err)
    return { success: false, error: 'Could not price your booking. Please try again.' }
  }
}

// ================================================
// Food order quote
// ================================================

export interface FoodOrderInput {
  phone: string
  name: string
  email?: string | null
  dateOfBirth?: string | null
  items: Array<{ id: string; quantity: number }>
  promoCode?: string | null
}

export async function quoteFoodOrder(
  input: FoodOrderInput
): Promise<QuoteResult<FoodOrderQuote>> {
  try {
    const customer = normaliseCustomer(input)
    if (!customer) {
      return { success: false, error: 'Please provide a valid 10-digit phone number and name.' }
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Your cart is empty.' }
    }

    const priced = await priceItems(input.items)
    if ('error' in priced) {
      return { success: false, error: priced.error }
    }

    const promo = await resolvePromoDiscount(input.promoCode, priced.total)
    const totalAmount = round2(Math.max(0, priced.total - promo.promoDiscount))

    return {
      success: true,
      quote: {
        kind: 'food_order',
        customer,
        items: priced.items,
        itemsTotal: priced.total,
        promoCode: promo.promoCode,
        promoCodeId: promo.promoCodeId,
        promoDiscount: promo.promoDiscount,
        totalAmount,
      },
    }
  } catch (err: any) {
    console.error('quoteFoodOrder error:', err)
    return { success: false, error: 'Could not price your order. Please try again.' }
  }
}
