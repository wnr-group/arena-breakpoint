-- ================================================
-- SEED DATA FOR BREAK POINT ARENA
-- ================================================

-- Clear existing data (for re-seeding)
TRUNCATE TABLE public.devices CASCADE;
TRUNCATE TABLE public.device_types CASCADE;

-- ================================================
-- 1. DEVICE TYPES (Based on pricing table)
-- ================================================

INSERT INTO public.device_types (name, display_name, regular_hourly_rate, included_players, max_players, extra_player_charge, description, display_order) VALUES
  ('standard_snooker', 'Standard Snooker Table', 379.00, 4, 8, 79.00, 'Standard size snooker table - perfect for casual games with up to 4 players included', 1),
  ('medium_snooker', 'Medium Snooker Table', 299.00, 4, 8, 79.00, 'Medium size snooker table - great for smaller groups with up to 4 players included', 2),
  ('american_pool', 'American Pool Table', 249.00, 4, 8, 49.00, 'American pool table - classic billiards experience with up to 4 players included', 3),
  ('ps5', 'PS5 Console', 200.00, 1, 4, 150.00, 'PlayStation 5 gaming console - latest games and titles, 1 player included, ₹150 per additional controller', 4),
  ('other', 'Other Gaming Device', 200.00, 1, 4, 100.00, 'Other gaming devices and activities', 5);

-- ================================================
-- 2. SAMPLE DEVICES (One for each type)
-- ================================================

-- Get device type IDs
DO $$
DECLARE
  v_standard_snooker_id UUID;
  v_medium_snooker_id UUID;
  v_american_pool_id UUID;
  v_ps5_id UUID;
  v_other_id UUID;
BEGIN
  -- Get device type IDs
  SELECT id INTO v_standard_snooker_id FROM device_types WHERE name = 'standard_snooker';
  SELECT id INTO v_medium_snooker_id FROM device_types WHERE name = 'medium_snooker';
  SELECT id INTO v_american_pool_id FROM device_types WHERE name = 'american_pool';
  SELECT id INTO v_ps5_id FROM device_types WHERE name = 'ps5';
  SELECT id INTO v_other_id FROM device_types WHERE name = 'other';

  -- Insert sample devices
  INSERT INTO public.devices (device_type_id, station_number, status, specs) VALUES
    (v_standard_snooker_id, 'SS-001', 'available', 'Full size standard snooker table with professional grade cloth. Includes cues, balls, and triangle. Up to 8 players (4 included in base rate).'),
    (v_medium_snooker_id, 'MS-001', 'available', 'Medium size snooker table perfect for casual play. Includes all accessories. Up to 8 players (4 included in base rate).'),
    (v_american_pool_id, 'AP-001', 'available', 'Professional American pool table with aramith balls. Includes cues and chalk. Up to 8 players (4 included in base rate).'),
    (v_ps5_id, 'PS5-001', 'available', 'PlayStation 5 console with DualSense controller, 4K gaming, and latest game library. Up to 4 players (₹150 per additional controller).'),
    (v_other_id, 'OTH-001', 'available', 'Other gaming and entertainment options. Contact staff for details.');
END $$;

-- ================================================
-- 3. SAMPLE MENU ITEMS (Optional - for testing)
-- ================================================

INSERT INTO public.menu_items (name, category, price, quantity, status, description) VALUES
  -- Snacks
  ('Samosa', 'Snacks', 20.00, 50, 'available', 'Crispy vegetable samosa'),
  ('French Fries', 'Snacks', 80.00, 30, 'available', 'Golden crispy french fries'),
  ('Nachos', 'Snacks', 120.00, 25, 'available', 'Nachos with cheese dip'),

  -- Drinks
  ('Coke', 'Drinks', 40.00, 100, 'available', 'Chilled Coca Cola'),
  ('Coffee', 'Drinks', 50.00, 50, 'available', 'Hot coffee'),
  ('Lemonade', 'Drinks', 60.00, 40, 'available', 'Fresh lemonade'),

  -- Meals
  ('Veg Burger', 'Meals', 120.00, 20, 'available', 'Delicious veg burger with fries'),
  ('Chicken Burger', 'Meals', 150.00, 20, 'available', 'Grilled chicken burger with fries'),
  ('Pasta', 'Meals', 180.00, 15, 'available', 'White sauce pasta with garlic bread');

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '📊 Device Types: 5 types added';
  RAISE NOTICE '🎮 Devices: 5 sample devices added (one per type)';
  RAISE NOTICE '🍔 Menu Items: 9 sample items added';
END $$;
