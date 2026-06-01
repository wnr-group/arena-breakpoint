export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  subscription_name: string | null;
  subscription_status: "active" | "expired" | "cancelled" | null;
  expiry_date: string | null;
}