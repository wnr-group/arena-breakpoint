"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { annotateRemovableFoodItems } from "@/lib/bookings/foodItems";
import { formatLocalDate } from "@/lib/utils/dates";
import { requireStaff } from "@/lib/auth/require-admin";

/** Rupee tolerance for float comparisons on money. */
const MONEY_EPSILON = 0.01

/**
 * Payment status derived from the figures actually being displayed.
 *
 * These reads already recompute `total_amount` and `balance_due` from the
 * component columns rather than trusting the stored total, but they used to hand
 * back the *stored* `payment_status` alongside them - so a booking that was paid
 * online and later had food added showed a positive balance next to a green
 * "Paid" badge, because nothing had rewritten the status column. Deriving it
 * from the same numbers keeps the badge and the balance telling one story.
 *
 * `refunded` and `failed` are passed through untouched: neither is recoverable
 * from amounts, and both are terminal.
 */
function derivePaymentStatus(
  correctTotal: number,
  amountPaid: number,
  storedStatus: string | null | undefined
): string {
  if (storedStatus === "refunded" || storedStatus === "failed") {
    return storedStatus;
  }

  // Nothing to collect - a free or fully discounted booking is settled.
  if (correctTotal <= MONEY_EPSILON) return "paid";

  if (amountPaid >= correctTotal - MONEY_EPSILON) return "paid";
  if (amountPaid > MONEY_EPSILON) return "partial";

  return "pending";
}

export interface BookingFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  deviceType?: string;
}

export interface TimelineBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  device_station_number: string;
  device_id: string;
  slot_start_time: string;
  slot_end_time: string;
  slot_date: string;
  status: string;
  total_amount: number;
}

/**
 * The days a booking belongs to on the bookings page: the sessions it reserves.
 * Food-only bookings hold no slot, so they fall back to the day they were
 * raised. Everything is YYYY-MM-DD, which compares correctly as a string.
 */
function getBookingDates(booking: any): string[] {
  const slotDates = (booking?.booking_device_slots || [])
    .map((slot: any) => slot?.slot_date)
    .filter(Boolean);

  if (slotDates.length > 0) return slotDates;

  return booking?.created_at ? [String(booking.created_at).split("T")[0]] : [];
}

/**
 * A booking is in range when any of its slots falls inside it. An empty bound
 * means "unbounded" - the All Time filter clears both.
 */
function isBookingInDateRange(
  booking: any,
  dateFrom?: string,
  dateTo?: string
): boolean {
  return getBookingDates(booking).some((date) => {
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  });
}

export async function getAllBookings(filters?: BookingFilters) {
  await requireStaff();

  try {
    let query = supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        customer_email,
        customer_dob,
        total_amount,
        amount_paid,
        cash_amount,
        card_amount,
        upi_amount,
        online_amount,
        razorpay_payment_id,
        device_subtotal,
        food_subtotal,
        subscription_discount,
        promo_discount,
        happy_hour_discount,
        status,
        payment_status,
        created_at,
        checked_in_at,
        completed_at,
        lock_expires_at,
        booking_device_slots(
          id,
          slot_date,
          slot_start_time,
          slot_end_time,
          device_type,
          device_station_number,
          duration_hours,
          hourly_rate,
          slot_total,
          player_count,
          included_players,
          extra_player_charge,
          extra_players_total
        ),
        booking_food_items(
          id,
          item_name,
          quantity,
          unit_price,
          line_total,
          status
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%,booking_number.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // Bookings are filtered on the session they reserve, not on when the row
    // was created: "today" here means today's slots, whenever they were booked.
    const inRange = (filters?.dateFrom || filters?.dateTo)
      ? (data || []).filter((booking: any) =>
          isBookingInDateRange(booking, filters.dateFrom, filters.dateTo)
        )
      : (data || []);

    // Calculate correct total_amount and balance_due for each booking
    const bookingsWithBalance = inRange.map((booking: any) => {
      const deviceSubtotal = Number(booking.device_subtotal || 0);
      const foodSubtotal = Number(booking.food_subtotal || 0);
      const subscriptionDiscount = Number(booking.subscription_discount || 0);
      const promoDiscount = Number(booking.promo_discount || 0);
      const happyHourDiscount = Number(booking.happy_hour_discount || 0);
      const amountPaid = Number(booking.amount_paid || 0);

      // Calculate correct total (don't trust stored value)
      const correctTotal = deviceSubtotal + foodSubtotal - subscriptionDiscount - promoDiscount - happyHourDiscount;
      const balanceDue = correctTotal - amountPaid;

      return {
        ...booking,
        total_amount: correctTotal, // Override with calculated value
        balance_due: balanceDue,
        payment_status: derivePaymentStatus(
          correctTotal,
          amountPaid,
          booking.payment_status
        )
      };
    });

    return { success: true, bookings: bookingsWithBalance };
  } catch (err: any) {
    console.error("Get bookings error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getBookingDetails(bookingId: string) {
  await requireStaff();

  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        booking_device_slots(
          id,
          device_id,
          slot_date,
          slot_start_time,
          slot_end_time,
          device_type,
          device_station_number,
          duration_hours,
          hourly_rate,
          slot_total,
          player_count,
          included_players,
          extra_player_charge,
          extra_players_total,
          devices(
            id,
            station_number,
            status,
            specs,
            image_url,
            device_type:device_types(
              id,
              name,
              display_name
            )
          )
        ),
        booking_food_items(
          id,
          menu_item_id,
          item_name,
          item_category,
          quantity,
          unit_price,
          line_total,
          status,
          created_at
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    // Also fetch line items to check what's unpaid
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: true });

    if (lineItemsError) {
      console.warn("Failed to fetch line items:", lineItemsError);
    }

    // Calculate unpaid items
    const unpaidItems = lineItems?.filter((item: any) => !item.is_paid) || [];

    // Calculate correct total_amount (don't trust stored value)
    const deviceSubtotal = Number(data.device_subtotal || 0);
    const foodSubtotal = Number(data.food_subtotal || 0);
    const subscriptionDiscount = Number(data.subscription_discount || 0);
    const promoDiscount = Number(data.promo_discount || 0);
    const happyHourDiscount = Number(data.happy_hour_discount || 0);
    const amountPaid = Number(data.amount_paid || 0);

    const correctTotal = deviceSubtotal + foodSubtotal - subscriptionDiscount - promoDiscount - happyHourDiscount;
    const balanceDue = correctTotal - amountPaid;

    return {
      success: true,
      booking: {
        ...data,
        total_amount: correctTotal, // Override with calculated value
        // Flags the food an admin added and nobody has paid for yet, which is
        // the only food the UI may offer to remove.
        booking_food_items: annotateRemovableFoodItems(data.booking_food_items, lineItems || []),
        line_items: lineItems || [],
        unpaid_items: unpaidItems,
        balance_due: balanceDue,
        payment_status: derivePaymentStatus(correctTotal, amountPaid, data.payment_status)
      }
    };
  } catch (err: any) {
    console.error("Get booking details error:", err);
    return { success: false, error: err.message, booking: null };
  }
}

export async function updateBookingStatus(bookingId: string, newStatus: string) {
  await requireStaff();

  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Update booking status error:", err);
    return { success: false, error: err.message };
  }
}

export async function checkInBooking(bookingId: string) {
  await requireStaff();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "checked_in",
        checked_in_at: now,
        updated_at: now
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Check-in booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function checkOutBooking(bookingId: string) {
  await requireStaff();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "completed",
        completed_at: now,
        updated_at: now
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Check-out booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function cancelBooking(bookingId: string, reason?: string) {
  await requireStaff();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: now
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Cancel booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function getBookingStats(
  filters?: Pick<BookingFilters, "dateFrom" | "dateTo">
) {
  await requireStaff();

  try {
    // Get counts by status. The slot dates come along so the counts can be
    // scoped to the same range as the list they sit above.
    const { data: allStatuses, error: statusError } = await supabaseAdmin
      .from("bookings")
      .select("status, created_at, booking_device_slots(slot_date)");

    if (statusError) throw statusError;

    const statusCounts = (filters?.dateFrom || filters?.dateTo)
      ? (allStatuses || []).filter((booking: any) =>
          isBookingInDateRange(booking, filters.dateFrom, filters.dateTo)
        )
      : (allStatuses || []);

    // Calculate today's revenue
    const today = new Date().toISOString().split("T")[0];
    const { data: todayBookings, error: revenueError } = await supabaseAdmin
      .from("bookings")
      .select("total_amount")
      .gte("created_at", today)
      .in("status", ["confirmed", "checked_in", "completed"]);

    if (revenueError) throw revenueError;

    const todayRevenue = (todayBookings || []).reduce(
      (sum: number, b: any) => sum + Number(b.total_amount || 0),
      0
    );

    // Group by status
    const grouped = (statusCounts || []).reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      stats: {
        total: statusCounts?.length || 0,
        confirmed: grouped.confirmed || 0,
        checked_in: grouped.checked_in || 0,
        completed: grouped.completed || 0,
        cancelled: grouped.cancelled || 0,
        locked: grouped.locked || 0,
        todayRevenue
      }
    };
  } catch (err: any) {
    console.error("Get booking stats error:", err);
    return { success: false, error: err.message, stats: null };
  }
}

export async function addFoodToBooking(
  bookingId: string,
  items: Array<{
    menuItemId: string;
    itemName: string;
    itemCategory: string;
    quantity: number;
    unitPrice: number;
  }>
) {
  await requireStaff();

  try {
    // VALIDATION: Check stock availability before adding
    const itemIds = items.map(item => item.menuItemId);
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, quantity, status")
      .in("id", itemIds);

    if (menuError) throw menuError;

    // Validate each item
    const unavailableItems: string[] = [];
    const insufficientStock: string[] = [];

    for (const orderItem of items) {
      const menuItem = menuItems?.find((m: any) => m.id === orderItem.menuItemId);

      if (!menuItem) {
        unavailableItems.push(orderItem.itemName);
        continue;
      }

      if (menuItem.status !== "available") {
        unavailableItems.push(menuItem.name);
        continue;
      }

      if (menuItem.quantity < orderItem.quantity) {
        insufficientStock.push(
          `${menuItem.name} (Available: ${menuItem.quantity}, Requested: ${orderItem.quantity})`
        );
      }
    }

    // If validation fails, return error
    if (unavailableItems.length > 0 || insufficientStock.length > 0) {
      let errorMessage = "Cannot add food items:\n";
      if (unavailableItems.length > 0) {
        errorMessage += `Unavailable: ${unavailableItems.join(", ")}\n`;
      }
      if (insufficientStock.length > 0) {
        errorMessage += `Insufficient stock: ${insufficientStock.join(", ")}`;
      }
      return { success: false, error: errorMessage };
    }

    // Calculate new food subtotal
    const foodLineItems = items.map((item) => ({
      booking_id: bookingId,
      menu_item_id: item.menuItemId,
      item_name: item.itemName,
      item_category: item.itemCategory,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
      status: "pending"
    }));

    const { data: foodItems, error: foodError } = await supabaseAdmin
      .from("booking_food_items")
      .insert(foodLineItems)
      .select();

    if (foodError) throw foodError;

    // Update booking food_subtotal and total_amount
    const additionalAmount = foodLineItems.reduce((sum, item) => sum + item.line_total, 0);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("food_subtotal, device_subtotal, subscription_discount, promo_discount, happy_hour_discount, amount_paid")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    const newFoodSubtotal = Number(booking.food_subtotal || 0) + additionalAmount;
    const deviceSubtotal = Number(booking.device_subtotal || 0);
    const subscriptionDiscount = Number(booking.subscription_discount || 0);
    const promoDiscount = Number(booking.promo_discount || 0);
    const happyHourDiscount = Number(booking.happy_hour_discount || 0);
    const amountPaid = Number(booking.amount_paid || 0);

    // Total = device + food - all discounts (discounts don't apply to food)
    const newTotal = deviceSubtotal + newFoodSubtotal - subscriptionDiscount - promoDiscount - happyHourDiscount;

    // Get current display_order for line items
    const { data: existingLineItems } = await supabaseAdmin
      .from("booking_line_items")
      .select("display_order")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: false })
      .limit(1);

    const startingOrder = (existingLineItems?.[0]?.display_order || 0) + 1;

    // Create line items for the food (for audit trail)
    const bookingLineItems = items.map((item, index) => ({
      booking_id: bookingId,
      item_type: 'food',
      description: item.itemName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.unitPrice * item.quantity,
      reference_id: item.menuItemId,
      reference_type: 'menu_item',
      added_by: 'admin',
      is_paid: false, // Food added by admin is unpaid
      display_order: startingOrder + index
    }));

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(bookingLineItems);

    if (lineItemsError) throw lineItemsError;

    // Determine payment status based on amount paid vs new total
    let newPaymentStatus: 'pending' | 'partial' | 'paid';
    if (amountPaid >= newTotal) {
      newPaymentStatus = 'paid'; // Already fully paid
    } else if (amountPaid > 0) {
      newPaymentStatus = 'partial'; // Partially paid (device paid, food unpaid)
    } else {
      newPaymentStatus = 'pending'; // Nothing paid yet
    }

    // Update booking
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        food_subtotal: newFoodSubtotal,
        total_amount: newTotal,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Decrement inventory for each item
    for (const item of items) {
      const { data: success, error: inventoryError } = await supabaseAdmin.rpc(
        "decrement_menu_item_quantity",
        {
          item_id: item.menuItemId,
          decrement_by: item.quantity,
        }
      );

      if (inventoryError || !success) {
        console.error("Inventory update error:", inventoryError || "Insufficient stock");
        // Log for monitoring but don't fail the order
        // (validation already happened above)
      }
    }

    return { success: true, foodItems, newTotal };
  } catch (err: any) {
    console.error("Add food to booking error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a food item an admin added to an existing booking - the undo for a
 * mistaken "Add Food". Reverses everything addFoodToBooking() did: the food
 * row, its billing line item, the booking totals and the stock it took.
 */
export async function removeFoodItemFromBooking(bookingId: string, foodItemId: string) {
  try {
    // Scoped to the booking, so an id belonging to another booking cannot be removed
    const { data: foodItem, error: foodItemError } = await supabaseAdmin
      .from("booking_food_items")
      .select("id, booking_id, menu_item_id, item_name, quantity, line_total")
      .eq("id", foodItemId)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (foodItemError) throw foodItemError;
    if (!foodItem) {
      return { success: false, error: "That food item is no longer on this booking." };
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(
        "status, device_subtotal, subscription_discount, promo_discount, happy_hour_discount, amount_paid"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    if (booking.status === "cancelled" || booking.status === "completed") {
      return {
        success: false,
        error: `This booking is ${booking.status}. Food can no longer be changed.`
      };
    }

    // Find the line item this food row was billed through. menu_item_id is
    // nullable (the menu item may have been deleted since), so fall back to the
    // stored name in that case.
    let lineItemQuery = supabaseAdmin
      .from("booking_line_items")
      .select("id, item_type, added_by, is_paid, quantity, reference_id, description")
      .eq("booking_id", bookingId)
      .eq("item_type", "food")
      .eq("added_by", "admin")
      .eq("is_paid", false)
      .eq("quantity", foodItem.quantity)
      .order("display_order", { ascending: false });

    lineItemQuery = foodItem.menu_item_id
      ? lineItemQuery.eq("reference_id", foodItem.menu_item_id)
      : lineItemQuery.is("reference_id", null).eq("description", foodItem.item_name);

    const { data: lineItems, error: lineItemError } = await lineItemQuery;

    if (lineItemError) throw lineItemError;

    const lineItem = (lineItems || [])[0];

    if (!lineItem) {
      return {
        success: false,
        error: `${foodItem.item_name} has already been paid for. Refund it instead of removing it.`
      };
    }

    // Delete the food row first: it is what the operator sees, and the totals
    // below are recomputed from what is actually left, so a failure after this
    // point still leaves the booking charging the right amount.
    const { error: deleteFoodError } = await supabaseAdmin
      .from("booking_food_items")
      .delete()
      .eq("id", foodItem.id)
      .eq("booking_id", bookingId);

    if (deleteFoodError) throw deleteFoodError;

    const { error: deleteLineItemError } = await supabaseAdmin
      .from("booking_line_items")
      .delete()
      .eq("id", lineItem.id);

    if (deleteLineItemError) {
      // The charge is already off the booking; a stale audit row is worth
      // logging but not worth failing the removal over.
      console.error("Failed to delete booking line item:", deleteLineItemError);
    }

    // Recompute from the rows that remain rather than subtracting from the
    // stored value, so the totals cannot drift.
    const { data: remainingFood, error: remainingError } = await supabaseAdmin
      .from("booking_food_items")
      .select("line_total")
      .eq("booking_id", bookingId);

    if (remainingError) throw remainingError;

    const newFoodSubtotal = (remainingFood || []).reduce(
      (sum: number, item: any) => sum + Number(item.line_total || 0),
      0
    );

    const deviceSubtotal = Number(booking.device_subtotal || 0);
    const subscriptionDiscount = Number(booking.subscription_discount || 0);
    const promoDiscount = Number(booking.promo_discount || 0);
    const happyHourDiscount = Number(booking.happy_hour_discount || 0);
    const amountPaid = Number(booking.amount_paid || 0);

    const newTotal =
      deviceSubtotal + newFoodSubtotal - subscriptionDiscount - promoDiscount - happyHourDiscount;

    // Same rule as addFoodToBooking, so removing the last unpaid item settles
    // a booking that was only "partial" because of it.
    let newPaymentStatus: "pending" | "partial" | "paid";
    if (amountPaid >= newTotal) {
      newPaymentStatus = "paid";
    } else if (amountPaid > 0) {
      newPaymentStatus = "partial";
    } else {
      newPaymentStatus = "pending";
    }

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        food_subtotal: newFoodSubtotal,
        total_amount: newTotal,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Give the stock back. addFoodToBooking() is the only path that decremented
    // it, and the line item check above guarantees we came from there.
    if (foodItem.menu_item_id) {
      const { error: inventoryError } = await supabaseAdmin.rpc("increment_menu_item_quantity", {
        item_id: foodItem.menu_item_id,
        increment_by: foodItem.quantity
      });

      if (inventoryError) {
        console.error("Failed to restore menu item stock:", inventoryError);
      }
    }

    return { success: true, newTotal, newFoodSubtotal, removedItemName: foodItem.item_name };
  } catch (err: any) {
    console.error("Remove food item from booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function createWalkInBooking(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerDob: string;
  deviceTypeId: string;
  deviceTypeName: string;
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  durationHours: number;
  hourlyRate: number;
  playerCount: number;
  includedPlayers: number;
  extraPlayerCharge: number;
  subtotal: number;
  total: number;
  subscriptionDiscount?: number;
  happyHourDiscount?: number;
  happyHourRuleId?: string | null;
}) {
  await requireStaff();

  try {
    // Convert time format from "10:00 AM" to "10:00:00"
    const formatTime = (timeStr: string) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return timeStr;

      let [, hours, minutes, period] = match;
      let hour = parseInt(hours);

      if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (period.toUpperCase() === "AM" && hour === 12) hour = 0;

      return `${hour.toString().padStart(2, '0')}:${minutes}:00`;
    };

    const startTime = formatTime(payload.slotStartTime);
    const endTime = formatTime(payload.slotEndTime);

    // Step 1: Get or create customer
    const { data: customerId, error: customerError } = await supabaseAdmin
      .rpc("get_or_create_customer", {
        p_phone: payload.customerPhone,
        p_name: payload.customerName,
        p_email: payload.customerEmail || null,
        p_dob: payload.customerDob
      });

    if (customerError) throw customerError;

    // Step 2: Generate booking number
    const { data: bookingNumber, error: bookingNumberError } = await supabaseAdmin
      .rpc("generate_booking_number");

    if (bookingNumberError) throw bookingNumberError;

    const extraPlayersCount = Math.max(0, payload.playerCount - payload.includedPlayers);
    const extraPlayersTotal = extraPlayersCount * payload.extraPlayerCharge * payload.durationHours;
    const deviceCharges = payload.subtotal; // Base station rate calculated by duration
    const deviceSubtotal = deviceCharges + extraPlayersTotal;
    const subscriptionDiscount = payload.subscriptionDiscount || 0;
    const happyHourDiscount = payload.happyHourDiscount || 0;
    const totalAmount = deviceSubtotal - subscriptionDiscount - happyHourDiscount;

    // A walk-in is someone standing at the counter, so the front desk should not
    // have to check them in as a second step - the booking starts already
    // checked in. Only same-day walk-ins though: this form also takes bookings up
    // to 6 days out (see isDateWithinBookingWindow), and marking one of those
    // checked_in would put a session that has not started into the dashboard's
    // active-session count and offer staff a Check Out button for it. Those stay
    // 'confirmed' and get checked in by hand when the customer turns up.
    const isToday = payload.selectedDate === formatLocalDate(new Date());
    const now = new Date().toISOString();

    // Step 3: Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail,
        customer_dob: payload.customerDob,
        device_subtotal: deviceSubtotal,
        food_subtotal: 0,
        subscription_discount: subscriptionDiscount,
        happy_hour_discount: happyHourDiscount,
        total_amount: totalAmount,
        status: isToday ? "checked_in" : "confirmed",
        checked_in_at: isToday ? now : null,
        payment_status: "pending",
        booking_source: "walk-in",
        lock_expires_at: null
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Step 4: Claim a station and write the slot
    // Station selection and the insert happen inside one locked transaction,
    // the same path a customer booking takes. Picking the station here instead
    // meant an exact-start-time check, which cannot see a 10:00-12:00 booking
    // when asked about 11:00-12:00 and so hands out a station already in use.
    const { data: assignment, error: slotError } = await supabaseAdmin.rpc(
      "assign_device_slot",
      {
        p_booking_id: booking.id,
        p_device_type_id: payload.deviceTypeId,
        p_slot_date: payload.selectedDate,
        p_slot_start_time: startTime,
        p_slot_end_time: endTime,
        p_duration_hours: payload.durationHours,
        p_hourly_rate: payload.hourlyRate,
        p_slot_total: payload.subtotal,
        p_device_type: payload.deviceTypeName,
        p_player_count: payload.playerCount,
        p_included_players: payload.includedPlayers,
        p_extra_player_charge: payload.extraPlayerCharge,
        p_extra_players_total: extraPlayersTotal
      }
    );

    if (slotError) {
      // Rollback booking if slot creation fails
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      throw slotError;
    }

    // Zero rows back means every station of this type is busy for the window
    if (!assignment || (assignment as any[]).length === 0) {
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      return {
        success: false,
        error: "No station of this type is free for the selected time. Pick another time or device."
      };
    }

    // Step 5: Create booking line items for audit trail & receipt presentation
    const lineItems: any[] = [];
    let displayOrder = 1;

    // 6.1: Device charge line item
    lineItems.push({
      booking_id: booking.id,
      item_type: 'device',
      description: `Device Booking (${payload.durationHours}h × ₹${payload.hourlyRate})`,
      quantity: payload.durationHours,
      unit_price: payload.hourlyRate,
      line_total: deviceCharges,
      added_by: 'admin',
      is_paid: false, // Walk-in starts as pending payment
      display_order: displayOrder++
    });

    // 6.2: Extra players line item (if applicable)
    if (extraPlayersCount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'extra_players',
        description: `Extra Players (${extraPlayersCount} × ₹${payload.extraPlayerCharge} × ${payload.durationHours}h)`,
        quantity: extraPlayersCount * payload.durationHours,
        unit_price: payload.extraPlayerCharge,
        line_total: extraPlayersTotal,
        added_by: 'admin',
        is_paid: false,
        display_order: displayOrder++
      });
    }

    // 6.3: Subscription discount line item (if applicable)
    if (subscriptionDiscount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'subscription_discount',
        description: 'Subscription Discount',
        quantity: 1,
        unit_price: -subscriptionDiscount,
        line_total: -subscriptionDiscount,
        added_by: 'admin',
        is_paid: false,
        display_order: displayOrder++
      });
    }

    // 6.4: Happy Hour discount line item (if applicable)
    if (happyHourDiscount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'happy_hour_discount',
        description: 'Happy Hour Discount',
        quantity: 1,
        unit_price: -happyHourDiscount,
        line_total: -happyHourDiscount,
        reference_type: payload.happyHourRuleId ? 'happy_hour' : null,
        reference_id: payload.happyHourRuleId || null,
        added_by: 'admin',
        is_paid: false,
        display_order: displayOrder++
      });
    }

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(lineItems);

    if (lineItemsError) {
      // Rollback booking and slots if line items insertion fails
      await supabaseAdmin.from("booking_device_slots").delete().eq("booking_id", booking.id);
      await supabaseAdmin.from("bookings").delete().eq("id", booking.id);
      throw lineItemsError;
    }

    return { success: true, bookingId: booking.id, bookingNumber, checkedIn: isToday };
  } catch (err: any) {
    console.error("Create walk-in booking error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Update player count for a booking slot
 */
export async function updatePlayerCount(slotId: string, newPlayerCount: number, maxPlayers: number) {
  await requireStaff();

  try {
    // Validate player count
    if (newPlayerCount < 1) {
      return { success: false, error: "Player count must be at least 1" };
    }

    if (newPlayerCount > maxPlayers) {
      return { success: false, error: `Player count cannot exceed ${maxPlayers}` };
    }

    // Get current slot details and booking info
    const { data: slot, error: slotError } = await supabaseAdmin
      .from("booking_device_slots")
      .select("*, bookings!inner(id, device_subtotal, food_subtotal, subscription_discount, promo_discount, happy_hour_discount)")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) throw slotError || new Error("Slot not found");

    const includedPlayers = slot.included_players || 1;
    const extraPlayerCharge = slot.extra_player_charge || 0;
    const durationHours = slot.duration_hours || 1;
    const oldPlayerCount = slot.player_count || includedPlayers;

    // Calculate new extra players charge (per hour * duration)
    const newExtraPlayers = Math.max(0, newPlayerCount - includedPlayers);
    const newExtraPlayersTotal = newExtraPlayers * extraPlayerCharge * durationHours;

    // Calculate old extra players charge (per hour * duration)
    const oldExtraPlayers = Math.max(0, oldPlayerCount - includedPlayers);
    const oldExtraPlayersTotal = oldExtraPlayers * extraPlayerCharge * durationHours;

    // Calculate difference in total
    const difference = newExtraPlayersTotal - oldExtraPlayersTotal;

    // Update slot
    const { error: updateSlotError } = await supabaseAdmin
      .from("booking_device_slots")
      .update({
        player_count: newPlayerCount,
        extra_players_total: newExtraPlayersTotal
      })
      .eq("id", slotId);

    if (updateSlotError) throw updateSlotError;

    // Recalculate booking amounts properly
    const newDeviceSubtotal = Number(slot.bookings.device_subtotal) + difference;
    const foodSubtotal = Number(slot.bookings.food_subtotal || 0);
    const subscriptionDiscount = Number(slot.bookings.subscription_discount || 0);
    const promoDiscount = Number(slot.bookings.promo_discount || 0);
    const happyHourDiscount = Number(slot.bookings.happy_hour_discount || 0);

    // Recalculate total: (device + food) - all discounts
    const newTotalAmount = newDeviceSubtotal + foodSubtotal - subscriptionDiscount - promoDiscount - happyHourDiscount;

    const { error: updateBookingError } = await supabaseAdmin
      .from("bookings")
      .update({
        device_subtotal: newDeviceSubtotal,
        total_amount: newTotalAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", slot.bookings.id);

    if (updateBookingError) throw updateBookingError;

    return {
      success: true,
      message: `Player count updated to ${newPlayerCount}`,
      newTotal: newTotalAmount
    };
  } catch (err: any) {
    console.error("Update player count error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get bookings for timeline view - specific date
 */
export async function getTimelineBookings(date: string): Promise<{ success: boolean; bookings: TimelineBooking[]; error?: string }> {
  await requireStaff();

  try {
    const { data, error } = await supabaseAdmin
      .from("booking_device_slots")
      .select(`
        id,
        device_id,
        slot_date,
        slot_start_time,
        slot_end_time,
        device_type,
        device_station_number,
        bookings!inner(
          id,
          booking_number,
          customer_name,
          customer_phone,
          status,
          total_amount
        )
      `)
      .eq("slot_date", date)
      .in("bookings.status", ["confirmed", "checked_in", "completed", "locked"])
      .order("slot_start_time", { ascending: true });

    if (error) throw error;

    const timelineBookings: TimelineBooking[] = (data || []).map((slot: any) => ({
      id: slot.bookings.id,
      booking_number: slot.bookings.booking_number,
      customer_name: slot.bookings.customer_name,
      customer_phone: slot.bookings.customer_phone,
      device_type: slot.device_type,
      device_station_number: slot.device_station_number,
      device_id: slot.device_id,
      slot_start_time: slot.slot_start_time,
      slot_end_time: slot.slot_end_time,
      slot_date: slot.slot_date,
      status: slot.bookings.status,
      total_amount: slot.bookings.total_amount
    }));

    return { success: true, bookings: timelineBookings };
  } catch (err: any) {
    console.error("Get timeline bookings error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function closeBooking(bookingId: string) {
  await requireStaff();

  try {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Close booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function getBookingBillingDetails(bookingId: string) {
  await requireStaff();

  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        total_amount,
        amount_paid,
        device_subtotal,
        food_subtotal,
        subscription_discount,
        promo_discount,
        happy_hour_discount,
        payment_status,
        status,
        booking_device_slots(
          id,
          duration_hours,
          hourly_rate,
          player_count,
          included_players,
          extra_player_charge,
          extra_players_total
        ),
        booking_food_items(
          id,
          item_name,
          quantity,
          unit_price,
          line_total
        )
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    // Fetch line items to check what's unpaid
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: true });

    if (lineItemsError) throw lineItemsError;

    // Calculate correct total_amount (don't trust stored value)
    const deviceSubtotal = Number(data.device_subtotal || 0);
    const foodSubtotal = Number(data.food_subtotal || 0);
    const subscriptionDiscount = Number(data.subscription_discount || 0);
    const promoDiscount = Number(data.promo_discount || 0);
    const happyHourDiscount = Number(data.happy_hour_discount || 0);
    const amountPaid = Number(data.amount_paid || 0);

    const correctTotal = deviceSubtotal + foodSubtotal - subscriptionDiscount - promoDiscount - happyHourDiscount;

    // Calculate unpaid amount
    const unpaidItems = lineItems?.filter((item: any) => !item.is_paid) || [];
    const unpaidAmount = unpaidItems.reduce((sum: number, item: any) => sum + Number(item.line_total), 0);
    const balanceDue = correctTotal - amountPaid;

    return {
      success: true,
      booking: {
        ...data,
        total_amount: correctTotal, // Override with calculated value
        line_items: lineItems,
        unpaid_items: unpaidItems,
        unpaid_amount: unpaidAmount,
        balance_due: balanceDue,
        payment_status: derivePaymentStatus(correctTotal, amountPaid, data.payment_status)
      }
    };
  } catch (err: any) {
    console.error("Get billing details error:", err);
    return { success: false, error: err.message, booking: null };
  }
}

// ============================================
// MARK PAYMENT AS PAID
// ============================================

export async function markBookingAsPaid(
  bookingId: string,
  paymentSplit: {
    cashAmount: number;
    cardAmount: number;
    upiAmount: number;
  }
) {
  await requireStaff();

  try {
    // Get booking details including current payment status
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select(
        "total_amount, amount_paid, cash_amount, card_amount, upi_amount, online_amount, booking_number"
      )
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) throw new Error("Booking not found");

    // Calculate balance due
    const currentAmountPaid = Number(booking.amount_paid || 0);
    const balanceDue = Number(booking.total_amount) - currentAmountPaid;

    // Validate that split amounts equal balance due (not total, since there might be partial payment)
    const totalSplit = paymentSplit.cashAmount + paymentSplit.cardAmount + paymentSplit.upiAmount;
    if (Math.abs(totalSplit - balanceDue) > 0.01) {
      throw new Error(`Payment split (₹${totalSplit}) does not match balance due (₹${balanceDue})`);
    }

    // Add the new payment to existing split amounts.
    // online_amount is carried through untouched: a customer who part-paid via
    // Razorpay and settles the rest at the counter must keep that record, and
    // check_payment_split asserts cash + card + upi + online = amount_paid.
    const newCashAmount = Number(booking.cash_amount || 0) + paymentSplit.cashAmount;
    const newCardAmount = Number(booking.card_amount || 0) + paymentSplit.cardAmount;
    const newUpiAmount = Number(booking.upi_amount || 0) + paymentSplit.upiAmount;
    const onlineAmount = Number(booking.online_amount || 0);
    const newAmountPaid = currentAmountPaid + totalSplit;

    // Determine if fully paid or still partial
    const newPaymentStatus = Math.abs(newAmountPaid - booking.total_amount) < 0.01 ? "paid" : "partial";

    // Update booking payment status with accumulated split amounts
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_status: newPaymentStatus,
        amount_paid: newAmountPaid,
        cash_amount: newCashAmount,
        card_amount: newCardAmount,
        upi_amount: newUpiAmount,
        online_amount: onlineAmount,
        // payment_method will be set automatically by trigger
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Mark all line items as paid
    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .update({ is_paid: true })
      .eq("booking_id", bookingId);

    if (lineItemsError) {
      console.error("Failed to update line items:", lineItemsError);
      throw new Error("Failed to update line items payment status");
    }

    // Update food items status from 'pending' to 'preparing' since they're now paid
    // This allows kitchen staff to start preparing paid orders
    const { error: foodItemsError } = await supabaseAdmin
      .from("booking_food_items")
      .update({ status: "preparing" })
      .eq("booking_id", bookingId)
      .eq("status", "pending"); // Only update pending items (not already preparing/ready/served)

    if (foodItemsError) {
      console.error("Failed to update food items status:", foodItemsError);
      // Don't throw - food status is non-critical, payment is already marked
      // This allows the transaction to succeed even if food status update fails
    }

    return {
      success: true,
      message: `Booking ${booking.booking_number} marked as paid`,
    };
  } catch (error: any) {
    console.error("Error marking booking as paid:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FOOD-ONLY WALK-IN BOOKING
// ============================================

export async function createFoodOnlyWalkInBooking(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDob: string | null;
  customerId: string | null;
  foodItems: { menuItemId: string; quantity: number; notes: string }[];
  totalAmount: number;
}) {
  await requireStaff();

  try {
    // Step 1: Get or create customer
    let customerId = payload.customerId;

    if (!customerId) {
      const { data: newCustomerId, error: customerError } = await supabaseAdmin
        .rpc("get_or_create_customer", {
          p_phone: payload.customerPhone,
          p_name: payload.customerName,
          p_email: payload.customerEmail || null,
          p_dob: payload.customerDob
        });

      if (customerError) throw customerError;
      customerId = newCustomerId;
    }

    // Step 2: Generate booking number
    const bookingNumber = `BP-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Date.now().toString().slice(-3)}`;

    // Step 3: Create booking record (food-only, no device)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail,
        booking_source: "walk-in",
        device_subtotal: 0, // No device booking
        food_subtotal: payload.totalAmount,
        subscription_discount: 0,
        promo_discount: 0,
        happy_hour_discount: 0,
        total_amount: payload.totalAmount,
        amount_paid: payload.totalAmount, // Walk-in pays immediately
        cash_amount: payload.totalAmount, // Default to cash, can be updated later
        card_amount: 0,
        upi_amount: 0,
        payment_status: "paid",
        status: "confirmed"
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Step 4: Get menu item details and create food items
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .in("id", payload.foodItems.map(item => item.menuItemId));

    if (menuError) throw menuError;

    const foodItemsToInsert = payload.foodItems.map(item => {
      const menuItem = menuItems?.find((mi: any) => mi.id === item.menuItemId);
      return {
        booking_id: booking.id,
        menu_item_id: item.menuItemId,
        item_name: menuItem?.name || "Unknown",
        item_category: menuItem?.category || "Other",
        quantity: item.quantity,
        unit_price: menuItem?.price || 0,
        line_total: (menuItem?.price || 0) * item.quantity,
        special_instructions: item.notes || null,
        status: "preparing" // Start preparing immediately for walk-in
      };
    });

    const { error: foodInsertError } = await supabaseAdmin
      .from("booking_food_items")
      .insert(foodItemsToInsert);

    if (foodInsertError) throw foodInsertError;

    // Step 5: Create line items for billing
    const lineItems: any[] = [];
    let displayOrder = 1;

    // Add food line items
    foodItemsToInsert.forEach(item => {
      lineItems.push({
        booking_id: booking.id,
        item_type: "food",
        description: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        reference_type: "menu_item",
        reference_id: item.menu_item_id,
        added_by: "customer",
        is_paid: true,
        display_order: displayOrder++
      });
    });

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(lineItems);

    if (lineItemsError) throw lineItemsError;

    return {
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.booking_number
    };
  } catch (error: any) {
    console.error("Error creating food-only walk-in booking:", error);
    return { success: false, error: error.message };
  }
}
