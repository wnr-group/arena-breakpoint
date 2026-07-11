-- ================================================
-- Create Admin and Staff Users in Supabase Auth
-- ================================================
-- Run this in Supabase Dashboard → SQL Editor
-- ================================================

-- ================================================
-- 1. CREATE ADMIN USER
-- ================================================
-- Email: admin@breakpointarena.com
-- Password: Admin@123
-- Role: admin (Full access including Reports)
-- ================================================

-- Create admin user in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@breakpointarena.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "admin"}',
    '{"full_name": "Arena Admin", "role": "admin"}',
    false,
    ''
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('Admin@123', gen_salt('bf')),
    updated_at = NOW();

-- ================================================
-- 2. CREATE STAFF USER
-- ================================================
-- Email: staff@breakpointarena.com
-- Password: Staff@123
-- Role: staff (Limited access - NO Reports)
-- ================================================

-- Create staff user in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'staff@breakpointarena.com',
    crypt('Staff@123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"], "role": "staff"}',
    '{"full_name": "Arena Staff", "role": "staff"}',
    false,
    ''
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('Staff@123', gen_salt('bf')),
    updated_at = NOW();

-- ================================================
-- 3. VERIFY USERS CREATED
-- ================================================

-- Check admin user
SELECT
    id,
    email,
    raw_user_meta_data->>'role' as role,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'admin@breakpointarena.com';

-- Check staff user
SELECT
    id,
    email,
    raw_user_meta_data->>'role' as role,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'staff@breakpointarena.com';

-- ================================================
-- 4. CREATE IDENTITIES (for email login)
-- ================================================

-- Admin identity
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    id::text,
    'email',
    jsonb_build_object('sub', id::text, 'email', email),
    NOW(),
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@breakpointarena.com'
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Staff identity
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    id,
    id::text,
    'email',
    jsonb_build_object('sub', id::text, 'email', email),
    NOW(),
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'staff@breakpointarena.com'
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin and Staff users created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 ADMIN LOGIN:';
    RAISE NOTICE '   Email: admin@breakpointarena.com';
    RAISE NOTICE '   Password: Admin@123';
    RAISE NOTICE '   Access: ✅ Full (including Reports)';
    RAISE NOTICE '';
    RAISE NOTICE '👤 STAFF LOGIN:';
    RAISE NOTICE '   Email: staff@breakpointarena.com';
    RAISE NOTICE '   Password: Staff@123';
    RAISE NOTICE '   Access: ⚠️ Limited (NO Reports access)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANT: Change these passwords in production!';
END $$;
