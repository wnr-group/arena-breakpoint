"use server";

import { supabaseAdmin } from "@/lib/supabase/server";

interface DBCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string;
  created_at: string;
}

interface DBSubscriptionPurchase {
  id: string;
  customer_id: string | null;
  subscription_id: string | null;
  is_active: boolean;
  expires_at: string;
}

interface DBSubscriptionPlan {
  id: string;
  name: string;
}

export async function getLiveCustomerRegistryAction() {
  const { data: customersData, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id, name, phone, email, date_of_birth,created_at")
    .order("name", { ascending: true });

  if (customerError) {
    return { data: [], error: customerError.message };
  }

  if (!customersData || customersData.length === 0) {
    return { data: [], error: null };
  }

  // 2. Fetch records from subscription_purchases (where customer_id actually resides)
  const { data: purchasesData, error: purchasesError } = await supabaseAdmin
    .from("subscription_purchases")
    .select("id, customer_id, subscription_id, is_active, expires_at");

  if (purchasesError) {
    return { data: [], error: purchasesError.message };
  }

  // 3. Fetch descriptions from the master subscriptions table
  const { data: plansData, error: plansError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, name");

  if (plansError) {
    return { data: [], error: plansError.message };
  }

  const formattedCustomers = (customersData as DBCustomer[]).map((customer: DBCustomer) => {
    const customerPurchases = (purchasesData as DBSubscriptionPurchase[] || []).filter(
      (purchase: DBSubscriptionPurchase) => purchase.customer_id === customer.id
    );
    const sortedPurchases = customerPurchases.sort(
      (a: DBSubscriptionPurchase, b: DBSubscriptionPurchase) =>
        new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
    );

    const latestPurchase = sortedPurchases[0] || null;

    let matchedPlanName: string | null = null;
    if (latestPurchase && latestPurchase.subscription_id) {
      const planMatch = (plansData as DBSubscriptionPlan[] || []).find(
        (plan: DBSubscriptionPlan) => plan.id === latestPurchase.subscription_id
      );
      if (planMatch) {
        matchedPlanName = planMatch.name;
      }
    }

    let computedStatus: "active" | "expired" | null = null;
    if (latestPurchase) {
      const isExpiredByTime = new Date(latestPurchase.expires_at).getTime() < Date.now();
      computedStatus = (latestPurchase.is_active && !isExpiredByTime) ? "active" : "expired";
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      date_of_birth: customer.date_of_birth,
      created_at: customer.created_at,
      subscription_name: matchedPlanName,
      subscription_status: computedStatus,
      expiry_date: latestPurchase?.expires_at || null,
    };
  });

  return { data: formattedCustomers, error: null };
}