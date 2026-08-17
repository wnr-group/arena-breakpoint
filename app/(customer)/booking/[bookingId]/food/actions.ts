"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getVerifiedCustomerPhone } from "@/lib/auth/customer-session";
import { settlementStatus } from "@/lib/payments/paymentStatus";

export async function getMenuItems() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .eq("status", "available")
      // Sold out is sold out even if some other database has not had the
      // menu_items trigger applied to it yet.
      .gt("quantity", 0)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    return { success: true, items: data || [] };
  } catch (err: any) {
    console.error("Error fetching menu items:", err);
    return { success: false, error: err.message, items: [] };
  }
}

export async function addFoodToBooking(
  bookingId: string,
  foodItems: Array<{
    menu_item_id: string;
    item_name: string;
    item_category: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>
) {
  try {
    // Get booking details first
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("customer_phone, food_subtotal, device_subtotal, total_amount")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    // The booking id comes from the URL, so it identifies a booking but proves
    // nothing about who is asking. Without this, anyone holding (or guessing) an
    // id could load another customer's tab with food they would be billed for.
    const verifiedPhone = await getVerifiedCustomerPhone();

    if (!verifiedPhone || verifiedPhone !== booking.customer_phone) {
      return {
        success: false,
        error: "Please verify your mobile number to add food to this booking.",
        verificationRequired: true,
      };
    }

    // Nothing may be ordered that the kitchen cannot serve. The same check the
    // admin Add Food dialog makes, for the same reason: the menu the customer is
    // looking at was loaded at some point in the past.
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, quantity, status")
      .in("id", foodItems.map(item => item.menu_item_id));

    if (menuError) throw menuError;

    const unavailable: string[] = [];

    for (const ordered of foodItems) {
      const menuItem = menuItems?.find((m: any) => m.id === ordered.menu_item_id);

      if (!menuItem || menuItem.status !== "available") {
        unavailable.push(ordered.item_name);
      } else if (menuItem.quantity < ordered.quantity) {
        unavailable.push(`${menuItem.name} (only ${menuItem.quantity} left)`);
      }
    }

    if (unavailable.length > 0) {
      return {
        success: false,
        error: `Sorry, we cannot serve ${unavailable.join(", ")} right now. Please adjust your order.`,
      };
    }

    // Insert food items
    const foodItemsToInsert = foodItems.map(item => ({
      booking_id: bookingId,
      ...item,
      status: "pending"
    }));

    const { error: insertError } = await supabaseAdmin
      .from("booking_food_items")
      .insert(foodItemsToInsert);

    if (insertError) throw insertError;

    /**
     * The insert above already fired `sync_booking_food_subtotal`, which sums the
     * booking's food rows and rewrites `food_subtotal` and `total_amount` as
     * `device + food - discounts`. Those columns belong to it.
     *
     * They used to be recomputed here as `device_subtotal + food_subtotal`, which
     * both raced the trigger and dropped every discount on the way past - so a
     * customer on a membership who ordered a plate of chips had the discount on
     * their slot silently written back out of their bill.
     */
    const { data: updated, error: refreshError } = await supabaseAdmin
      .from("bookings")
      .select("total_amount, amount_paid")
      .eq("id", bookingId)
      .single();

    if (refreshError) throw refreshError;

    // The audit trail the bill and the reports are built from. Without these
    // rows the food was on the total and in no breakdown of it.
    const { data: lastLineItem } = await supabaseAdmin
      .from("booking_line_items")
      .select("display_order")
      .eq("booking_id", bookingId)
      .order("display_order", { ascending: false })
      .limit(1);

    const startingOrder = (lastLineItem?.[0]?.display_order || 0) + 1;

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(
        foodItems.map((item, index) => ({
          booking_id: bookingId,
          item_type: "food",
          description: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          reference_id: item.menu_item_id,
          reference_type: "menu_item",
          added_by: "customer",
          // Ordered against an existing booking, settled at the desk.
          is_paid: false,
          display_order: startingOrder + index,
        }))
      );

    if (lineItemsError) throw lineItemsError;

    /**
     * The bill has grown, so what was settled may no longer be.
     *
     * This is the whole of the reported bug: a customer who had paid for their
     * slot online and then ordered food against it stayed marked `paid` while
     * owing for the food. It kept the booking out of the outstanding figure on
     * the reports page, and sent every revenue split down the "fully paid"
     * branch, which shared the ₹249 they had actually handed over across the
     * ₹399 they now owed and reported food revenue that was never collected.
     */
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_status: settlementStatus({
          amountPaid: Number(updated.amount_paid || 0),
          total: Number(updated.total_amount || 0),
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // Take the stock. Nothing else on this path did, so a customer ordering the
    // last of something left it on the menu for the next one.
    for (const item of foodItems) {
      const { error: inventoryError } = await supabaseAdmin.rpc(
        "decrement_menu_item_quantity",
        { item_id: item.menu_item_id, decrement_by: item.quantity }
      );

      // The order is placed and the customer has been told so; a stock count that
      // did not move is for someone to reconcile, not a reason to fail them now.
      if (inventoryError) {
        console.error("Inventory decrement failed for item", item.menu_item_id, inventoryError);
      }
    }

    return { success: true, phone: booking.customer_phone };
  } catch (err: any) {
    console.error("Error adding food to booking:", err);
    return { success: false, error: err.message };
  }
}
