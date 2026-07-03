"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

export interface MenuItemFilters {
  category?: string;
  searchQuery?: string;
  availableOnly?: boolean;
}

export async function getMenuItems(filters?: MenuItemFilters) {
  try {
    let query = supabaseAdmin
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (filters?.availableOnly) {
      query = query.eq("status", "available");
    }

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    if (filters?.searchQuery) {
      query = query.ilike("name", `%${filters.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, menuItems: data || [] };
  } catch (err: any) {
    console.error("Get menu items error:", err);
    return { success: false, error: err.message, menuItems: [] };
  }
}
// validate menu items stock and availability before adding to cart
export async function validateMenuItems(
  items: Array<{ menu_item_id: string; quantity: number }>
) {
  try {
    const itemIds = items.map((item) => item.menu_item_id);

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, price, quantity, status")
      .in("id", itemIds);

    if (error) throw error;

    const unavailableItems: string[] = [];
    const insufficientStock: string[] = [];

    items.forEach((orderItem) => {
      const menuItem = data?.find((item: any) => item.id === orderItem.menu_item_id);

      if (!menuItem) {
        unavailableItems.push(orderItem.menu_item_id);
        return;
      }

      if (menuItem.status !== "available") {
        unavailableItems.push(menuItem.name);
        return;
      }

      if (menuItem.quantity < orderItem.quantity) {
        insufficientStock.push(
          `${menuItem.name} (Available: ${menuItem.quantity})`
        );
      }
    });

    if (unavailableItems.length > 0 || insufficientStock.length > 0) {
      return {
        success: false,
        error: "Some items are unavailable",
        unavailableItems,
        insufficientStock,
      };
    }

    return { success: true, validatedItems: data };
  } catch (err: any) {
    console.error("Validate menu items error:", err);
    return { success: false, error: err.message };
  }
}

export async function addFoodOrderToBooking(
  bookingId: string,
  items: Array<{
    menu_item_id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
  }>
) {
  try {
    // First, get the booking to ensure it exists
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, food_subtotal, device_subtotal, total_amount")
      .eq("id", bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Create food order line items
    const foodItems = items.map((item) => ({
      booking_id: bookingId,
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      item_category: item.category,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
      status: "pending",
    }));

    const { data: createdItems, error: foodError } = await supabaseAdmin
      .from("booking_food_items")
      .insert(foodItems)
      .select();

    if (foodError) throw foodError;

    // Update inventory quantities
    for (const item of items) {
      const { data: success, error: inventoryError } = await supabaseAdmin.rpc(
        "decrement_menu_item_quantity",
        {
          item_id: item.menu_item_id,
          decrement_by: item.quantity,
        }
      );

      if (inventoryError || !success) {
        console.error("Inventory update error:", inventoryError);
        // Log for monitoring but don't fail the order
        // (validation already happened, this is just audit trail)
      }
    }

    // Calculate new totals
    const additionalAmount = foodItems.reduce(
      (sum, item) => sum + item.line_total,
      0
    );
    const newFoodSubtotal = Number(booking.food_subtotal || 0) + additionalAmount;
    const newTotal = Number(booking.device_subtotal || 0) + newFoodSubtotal;

    // Update booking totals
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        food_subtotal: newFoodSubtotal,
        total_amount: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    return {
      success: true,
      foodItems: createdItems,
      newFoodSubtotal,
      newTotal,
    };
  } catch (err: any) {
    console.error("Add food to booking error:", err);
    return { success: false, error: err.message };
  }
}

export async function createStandaloneFoodOrder(
  phone: string,
  name: string,
  email: string | null,
  date_of_birth: string,
  items: Array<{
    menu_item_id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
  }>,
  promoCode?: string | null,
  promoDiscount?: number
) {
  try {
    // Get or create customer
    const { data: customerId, error: customerError } = await supabaseAdmin.rpc(
      "get_or_create_customer",
      {
        p_phone: phone,
        p_name: name,
        p_email: email,
        p_dob: date_of_birth,
      }
    );

    if (customerError) throw customerError;

    // Generate booking number
    const { data: bookingNumber, error: bookingNumberError } =
      await supabaseAdmin.rpc("generate_booking_number");

    if (bookingNumberError) throw bookingNumberError;

    // Calculate total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Fetch promo code if provided
    let promoCodeId = null;
    let finalPromoDiscount = 0;
    if (promoCode) {
      const { data: promoData } = await supabaseAdmin
        .from("promo_codes")
        .select("id")
        .ilike("code", promoCode.trim())
        .single();
      
      if (promoData) {
        promoCodeId = promoData.id;
        finalPromoDiscount = promoDiscount || 0;
      }
    }

    const finalTotal = Math.max(0, totalAmount - finalPromoDiscount);

    // Create food-only booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: customerId,
        customer_phone: phone,
        customer_name: name,
        customer_email: email,
        customer_dob: date_of_birth,
        device_subtotal: 0,
        food_subtotal: totalAmount,
        promo_discount: finalPromoDiscount,
        promo_code_id: promoCodeId,
        total_amount: finalTotal,
        amount_paid: finalTotal,
        cash_amount: 0,  // Online payment, not cash
        card_amount: finalTotal,  // Assume card/online payment
        upi_amount: 0,  // Not UPI unless specified
        status: "confirmed",
        payment_status: "paid",
        locked_by: "customer",
      })
      .select("id, booking_number")
      .single();

    if (bookingError) throw bookingError;

    // Create food items
    const foodItems = items.map((item) => ({
      booking_id: booking.id,
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      item_category: item.category,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
      status: "pending",
    }));

    const { error: foodError } = await supabaseAdmin
      .from("booking_food_items")
      .insert(foodItems);

    if (foodError) throw foodError;

    // Create line items for the booking audit trail
    const lineItems: any[] = [];
    let displayOrder = 1;

    for (const item of items) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'food',
        description: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.price * item.quantity,
        added_by: 'customer',
        is_paid: true,
        display_order: displayOrder++
      });
    }

    if (finalPromoDiscount > 0) {
      lineItems.push({
        booking_id: booking.id,
        item_type: 'promo_discount',
        description: promoCode ? `Promo Code Discount (${promoCode})` : 'Promo Code Discount',
        quantity: 1,
        unit_price: -finalPromoDiscount,
        line_total: -finalPromoDiscount,
        added_by: 'customer',
        is_paid: true,
        display_order: displayOrder++
      });
    }

    const { error: lineItemsError } = await supabaseAdmin
      .from("booking_line_items")
      .insert(lineItems);

    if (lineItemsError) {
      console.error("Failed to insert booking line items:", lineItemsError);
    }

    // Update inventory
    for (const item of items) {
      const { data: success, error: inventoryError } = await supabaseAdmin.rpc(
        "decrement_menu_item_quantity",
        {
          item_id: item.menu_item_id,
          decrement_by: item.quantity,
        }
      );

      if (inventoryError || !success) {
        console.error("Inventory update error:", inventoryError || "Insufficient stock");
        // Log for monitoring but don't fail the order
      }
    }

    return {
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      totalAmount: finalTotal,
    };
  } catch (err: any) {
    console.error("Create standalone food order error:", err);
    return { success: false, error: err.message };
  }
}

export async function getMenuCategories(): Promise<{
  success: boolean;
  categories: string[];
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("category")
      .eq("status", "available");

    if (error) throw error;

    const categories = Array.from(
      new Set(data?.map((item: any) => item.category) || [])
    ).sort() as string[];

    return { success: true, categories };
  } catch (err: any) {
    console.error("Get menu categories error:", err);
    return { success: false, error: err.message, categories: [] };
  }
}
