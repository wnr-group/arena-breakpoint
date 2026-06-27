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

    return { success: true, bookings: data || [] };
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

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Error fetching booking:", err);
    return { success: false, error: err.message, booking: null };
  }
}
