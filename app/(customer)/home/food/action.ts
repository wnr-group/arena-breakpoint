"use server"

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getMenuItems() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .eq("status", "available")
      // Stock as well as status. The trigger on menu_items keeps the two in step,
      // so this is saying the same thing twice - deliberately, because it is the
      // count that decides whether the kitchen can actually serve it, and this
      // query should not start offering sold-out food on a database where that
      // trigger has not been applied yet.
      .gt("quantity", 0)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      menuItems: data || []
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      menuItems: []
    };
  }
}