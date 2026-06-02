-- Create the Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  -- If a plan is deleted from the database, we don't want to delete the customer. We just set this to NULL.
  active_subscription UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimize queries searching by phone number
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Enable Row Level Security on the table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users (like your Next.js server/admins) to read customers
CREATE POLICY "Allow authenticated read access to customers"
ON public.customers FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to create new customers (Registration)
CREATE POLICY "Allow authenticated insert to customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update customers (e.g., setting active_subscription)
CREATE POLICY "Allow authenticated update to customers"
ON public.customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);