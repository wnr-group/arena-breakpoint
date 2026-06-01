-- Create the devices table 
CREATE TABLE public.devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('PS5','Standard Snooker', 'Medium Snooker', 'American Snooker')),
  station_number TEXT NOT NULL UNIQUE,
  specs TEXT,
  hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance', 'inactive')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1. Enable RLS on the devices table (if not already done)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- 2. SELECT (Read Policy)
-- Allows anyone (or authenticated users) to read the device inventory
CREATE POLICY "Allow read access for all devices" 
ON public.devices 
FOR SELECT 
USING (true);

-- 3. INSERT (Create Policy)
-- Allows authenticated dashboard operators to add new machines
CREATE POLICY "Allow insert for authenticated users" 
ON public.devices 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. UPDATE (Edit Policy)
-- Allows updating a device's status, specs, or station number
CREATE POLICY "Allow update for authenticated users" 
ON public.devices 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. DELETE (Remove Policy)
-- Allows wiping a machine from the inventory via the dashboard
CREATE POLICY "Allow delete for authenticated users" 
ON public.devices 
FOR DELETE 
TO authenticated 
USING (true);

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-images', 'device-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy to allow ANYONE to read/view images (Crucial for dashboard rendering)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'device-images');

-- 4. Policy to allow uploads (INSERT)
CREATE POLICY "Allow public upload access"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'device-images');

-- 5. Policy to allow overrides/replacements (UPDATE)
CREATE POLICY "Allow public update access"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'device-images')
WITH CHECK (bucket_id = 'device-images');


-- 2. CREATE CLIENT BOOKINGS ENGINE 
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('PS5', 'Standard Snooker', 'Medium Snooker', 'American Snooker')),
  hourly_rate NUMERIC(10, 2) NOT NULL,
  selected_date DATE NOT NULL,
  selected_slot TEXT NOT NULL,
  slot_start_time TEXT NOT NULL,
  slot_end_time TEXT NOT NULL,
  addons JSONB DEFAULT '[]'::jsonb NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  subscription_discount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  promo_discount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  promo_code TEXT,
  total NUMERIC(10, 2) NOT NULL,
  phone TEXT,
  name TEXT,
  email TEXT,
  status TEXT DEFAULT 'soft_locked' NOT NULL CHECK (status IN ('soft_locked', 'confirmed', 'cancelled', 'completed')),
  slot_lock_expiry BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. SECURITY INTERFACES ENABLEMENT (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous inserts for checkout funnel" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updates during reservation adjustments" ON public.bookings FOR UPDATE USING (true);

-- 6. INDEX LOOPS FOR ATOMIC LOCK SCANS
CREATE INDEX IF NOT EXISTS idx_active_slots_lookup ON public.bookings (selected_date, selected_slot, status) WHERE status IN ('soft_locked', 'confirmed');