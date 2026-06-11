-- ================================================
-- Seed Admin User for Supabase Auth
-- ================================================
-- Purpose: Create admin user for dashboard authentication
-- Email: admin@breakpointarena.com
-- Password: Admin@123
-- Session timeout: 12 hours
-- ================================================

-- Insert admin user into auth.users
-- Note: Supabase uses pgcrypto for password hashing
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@breakpointarena.com',
  -- Password: Admin@123 (hashed with crypt function)
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"full_name":"Arena Admin","role":"admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Create identities entry for the admin user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  id,
  jsonb_build_object(
    'sub', id::text,
    'email', 'admin@breakpointarena.com'
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@breakpointarena.com'
ON CONFLICT (provider, id) DO NOTHING;

-- Update Supabase Auth configuration for 12-hour session timeout
-- This sets the JWT expiry to 43200 seconds (12 hours)
-- Note: This requires Supabase CLI to update auth config
-- For now, we'll document this - actual config is in supabase/config.toml

-- ================================================
-- IMPORTANT: Update supabase/config.toml
-- ================================================
-- Add this to your config.toml if not already present:
--
-- [auth]
-- site_url = "http://localhost:3000"
-- additional_redirect_urls = ["http://localhost:3000"]
-- jwt_expiry = 43200  # 12 hours in seconds
-- enable_signup = false  # Disable public signups
--
-- [auth.email]
-- enable_signup = false
-- double_confirm_changes = true
-- enable_confirmations = false
-- ================================================

COMMENT ON TABLE auth.users IS 'Supabase Auth users table with seeded admin user (admin@breakpointarena.com)';
