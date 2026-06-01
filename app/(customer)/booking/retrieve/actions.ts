"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getBookingByNumber(bookingNumber: string) {
  try {
    if (!bookingNumber || !bookingNumber.trim()) {
      return { success: false, error: "Booking number is required", booking: null };
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        booking_device_slots (*),
        booking_food_items (*)
      `)
      .eq("booking_number", bookingNumber.trim().toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return { success: false, error: "No booking found with this number", booking: null };
      }
      throw error;
    }

    return { success: true, booking: data };
  } catch (err: any) {
    console.error("Error fetching booking:", err);
    return { success: false, error: err.message || "Failed to fetch booking", booking: null };
  }
}
