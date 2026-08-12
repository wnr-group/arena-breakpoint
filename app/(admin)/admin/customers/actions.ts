"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/require-admin";

interface DBCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string;
  created_at: string;
}

interface DBSubscription {
  id: string;
  customer_id: string | null;
  subscription_plan_id: string | null;
  status: string;
  end_date: string;
}

interface DBSubscriptionPlan {
  id: string;
  name: string;
}

export async function getLiveCustomerRegistryAction() {
  await requireStaff();

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

  // 2. Fetch records from subscriptions table
  const { data: subscriptionsData, error: subscriptionsError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, customer_id, subscription_plan_id, status, end_date");

  if (subscriptionsError) {
    return { data: [], error: subscriptionsError.message };
  }

  // 3. Fetch descriptions from the subscription_plans table
  const { data: plansData, error: plansError } = await supabaseAdmin
    .from("subscription_plans")
    .select("id, name");

  if (plansError) {
    return { data: [], error: plansError.message };
  }

  const formattedCustomers = (customersData as DBCustomer[]).map((customer: DBCustomer) => {
    const customerSubscriptions = (subscriptionsData as DBSubscription[] || []).filter(
      (sub: DBSubscription) => sub.customer_id === customer.id
    );
    const sortedSubscriptions = customerSubscriptions.sort(
      (a: DBSubscription, b: DBSubscription) =>
        new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    );

    const latestSubscription = sortedSubscriptions[0] || null;

    let matchedPlanName: string | null = null;
    if (latestSubscription && latestSubscription.subscription_plan_id) {
      const planMatch = (plansData as DBSubscriptionPlan[] || []).find(
        (plan: DBSubscriptionPlan) => plan.id === latestSubscription.subscription_plan_id
      );
      if (planMatch) {
        matchedPlanName = planMatch.name;
      }
    }

    let computedStatus: "active" | "expired" | null = null;
    if (latestSubscription) {
      const isExpiredByTime = new Date(latestSubscription.end_date).getTime() < Date.now();
      computedStatus = (latestSubscription.status === 'active' && !isExpiredByTime) ? "active" : "expired";
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
      expiry_date: latestSubscription?.end_date || null,
    };
  });

  return { data: formattedCustomers, error: null };
}