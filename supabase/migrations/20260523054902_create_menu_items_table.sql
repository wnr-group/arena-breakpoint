CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Snacks', 'Drinks', 'Meals')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock', 'hidden')),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Enable Row Level Security on the table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow anyone (Public/Anonymous/Authenticated) to view menu items
CREATE POLICY "Allow public read access to menu items"
ON public.menu_items FOR SELECT
USING (true);

-- 3. Policy: Allow only Authenticated Admins to insert new food items
CREATE POLICY "Allow admin to insert menu items"
ON public.menu_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Policy: Allow only Authenticated Admins to update existing food configurations
CREATE POLICY "Allow admin to update menu items"
ON public.menu_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Policy: Allow only Authenticated Admins to delete food items from the database
CREATE POLICY "Allow admin to delete menu items"
ON public.menu_items FOR DELETE
TO authenticated
USING (true);

-- 1. Create a Public Storage Bucket for Food Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Security Policy: Allow anyone (Public) to view images
CREATE POLICY "Allow Public Image Downloads"
ON storage.objects FOR SELECT
TO anon,authenticated
USING (bucket_id = 'food-images');

-- 3. Security Policy: Allow authenticated managers to Upload images
CREATE POLICY "Allow Admin Image Uploads"
ON storage.objects FOR INSERT
TO anon,authenticated
WITH CHECK (bucket_id = 'food-images');

-- 4. Security Policy: Allow authenticated managers to Update existing images
CREATE POLICY "Allow Admin Image Updates"
ON storage.objects FOR UPDATE
TO anon,authenticated
USING (bucket_id = 'food-images');

-- 5. Security Policy: Allow authenticated managers to Delete old images
CREATE POLICY "Allow Admin Image Deletions"
ON storage.objects FOR DELETE
TO anon,authenticated
USING (bucket_id = 'food-images');
