"use server"

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getMenuItems() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*")
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