"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getCustomerBookings(phone: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        booking_device_slots (*),
        booking_food_items (*)
      `)
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate balance_due for each booking
    const bookingsWithBalance = (data || []).map((booking: any) => ({
      ...booking,
      balance_due: Number(booking.total_amount || 0) - Number(booking.amount_paid || 0)
    }));

    return { success: true, bookings: bookingsWithBalance };
  } catch (err: any) {
    console.error("Error fetching bookings:", err);
    return { success: false, error: err.message, bookings: [] };
  }
}

export async function getBookingById(bookingId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        booking_device_slots (*),
        booking_food_items (*)
      `)
      .eq("id", bookingId)
      .single();

    if (error) throw error;

    // Calculate balance_due
    const bookingWithBalance = {
      ...data,
      balance_due: Number(data.total_amount || 0) - Number(data.amount_paid || 0)
    };

    return { success: true, booking: bookingWithBalance };
  } catch (err: any) {
    console.error("Error fetching booking:", err);
    return { success: false, error: err.message, booking: null };
  }
}
