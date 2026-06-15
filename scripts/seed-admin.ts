/**
 * Seed Admin User Script
 *
 * Creates admin user in Supabase Auth
 * Email: admin@breakpointarena.com
 * Password: Admin@123
 *
 * Run: npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedAdmin() {
  console.log('🌱 Seeding admin user...')

  const email = 'admin@breakpointarena.com'
  const password = 'Admin@123'

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(user => user.email === email)

    if (userExists) {
      console.log('✅ Admin user already exists:', email)
      return
    }

    // Create admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Arena Admin',
        role: 'admin',
      },
      app_metadata: {
        role: 'admin',
        provider: 'email',
      },
    })

    if (error) {
      console.error('❌ Error creating admin user:', error.message)
      process.exit(1)
    }

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 User ID:', data.user?.id)
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

seedAdmin()
