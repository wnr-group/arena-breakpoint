"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLivePromoListAction() {
  const { data, error } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data || [], error: error?.message || null };
}

export async function commitNewPromoAction(payload: {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}) {
  const { error } = await supabaseAdmin
    .from("promo_codes")
    .insert([
      {
        code: payload.code.toUpperCase().trim(),
        description: payload.description,
        discount_type: payload.discount_type,
        discount_value: payload.discount_value,
        valid_from: payload.valid_from,
        valid_to: payload.valid_to,
        is_active: payload.is_active,
      },
    ]);

  if (!error) revalidatePath("/admin/promo-code");
  return { success: !error, error: error?.message || null };
}

export async function updateExistingPromoAction(
  id: number,
  payload: {
    code: string;
    description: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    valid_from: string;
    valid_to: string;
    is_active: boolean;
  }
) {
  const { error } = await supabaseAdmin
    .from("promo_codes")
    .update({
      code: payload.code.toUpperCase().trim(),
      description: payload.description,
      discount_type: payload.discount_type,
      discount_value: payload.discount_value,
      valid_from: payload.valid_from,
      valid_to: payload.valid_to,
      is_active: payload.is_active,
    })
    .eq("id", id);

  if (!error) revalidatePath("/admin/promo-code");
  return { success: !error, error: error?.message || null };
}

export async function executePromoDeletionAction(id: number) {
  const { error } = await supabaseAdmin
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (!error) revalidatePath("/admin/promo-code");
  return { success: !error, error: error?.message || null };
}