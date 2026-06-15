import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug: Check if service role key is loaded
if (!supabaseServiceKey || supabaseServiceKey.length < 100) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set or invalid!')
  console.error('Current value length:', supabaseServiceKey?.length)
  console.error('Expected: JWT token with length ~160 characters')
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY loaded (length:', supabaseServiceKey.length, ')')
}

// Server-side client with service role key (full access)
// Use only in Server Actions and API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
