"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export interface BookingFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  deviceType?: string;
}

export async function getAllBookings(filters?: BookingFilters) {
  try {
    let query = supabaseAdmin
      .from("bookings")
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        customer_email,
        total_amount,
        device_subtotal,
        food_subtotal,
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
          slot_total
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

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `customer_name.ilike.%${filters.searchQuery}%,customer_phone.ilike.%${filters.searchQuery}%,booking_number.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, bookings: data || [] };
  } catch (err: any) {
    console.error("Get bookings error:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getBookingDetails(bookingId: string) {
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

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Get booking details error:", err);
    return { success: false, error: err.message, booking: null };
  }
}

export async function updateBookingStatus(bookingId: string, newStatus: string) {
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

export async function getBookingStats() {
  try {
    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from("bookings")
      .select("status", { count: "exact", head: false });

    if (statusError) throw statusError;

    // Calculate today's revenue
    const today = new Date().toISOString().split("T")[0];
    const { data: todayBookings, error: revenueError } = await supabaseAdmin
      .from("bookings")
      .select("total_amount")
      .gte("created_at", today)
      .in("status", ["confirmed", "checked_in", "completed"]);

    if (revenueError) throw revenueError;

    const todayRevenue = (todayBookings || []).reduce(
      (sum, b) => sum + Number(b.total_amount || 0),
      0
    );

    // Group by status
    const grouped = (statusCounts || []).reduce((acc: any, item) => {
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
  try {
    // Calculate new food subtotal
    const lineItems = items.map((item) => ({
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
      .insert(lineItems)
      .select();

    if (foodError) throw foodError;

    // Update booking food_subtotal and total_amount
    const additionalAmount = lineItems.reduce((sum, item) => sum + item.line_total, 0);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("food_subtotal, device_subtotal")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    const newFoodSubtotal = Number(booking.food_subtotal || 0) + additionalAmount;
    const newTotal = Number(booking.device_subtotal || 0) + newFoodSubtotal;

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        food_subtotal: newFoodSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    return { success: true, foodItems, newTotal };
  } catch (err: any) {
    console.error("Add food to booking error:", err);
    return { success: false, error: err.message };
  }
}
