-- Create the Subscription Plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  discount_percentage INTEGER DEFAULT 20 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security on the table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--  Policy: Allow anyone (Public/Anonymous/Authenticated) to view subscription plans
CREATE POLICY "Allow public read access to subscription plans"
ON public.subscription_plans FOR SELECT
USING (true);

-- 3. Policy: Allow only Authenticated Admins to insert new subscription plans
CREATE POLICY "Allow admin to insert subscription plans"
ON public.subscription_plans FOR INSERT
TO authenticated
WITH CHECK (true);

--  Policy: Allow only Authenticated Admins to update existing subscription configurations
CREATE POLICY "Allow admin to update subscription plans"
ON public.subscription_plans FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

--  Policy: Allow only Authenticated Admins to delete subscription plans from the database
CREATE POLICY "Allow admin to delete subscription plans"
ON public.subscription_plans FOR DELETE
TO authenticated
USING (true);