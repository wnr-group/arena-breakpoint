/**
 * Seed Staff User Script
 *
 * Creates staff user in Supabase Auth
 * Email: staff@breakpointarena.com
 * Password: Staff@123
 *
 * Staff has access to all pages EXCEPT Reports
 *
 * Run: npx tsx scripts/seed-staff.ts
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

async function seedStaff() {
  console.log('🌱 Seeding staff user...')

  const email = 'staff@breakpointarena.com'
  const password = 'Staff@123'

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(user => user.email === email)

    if (userExists) {
      console.log('✅ Staff user already exists:', email)
      return
    }

    // Create staff user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Arena Staff',
        role: 'staff',
      },
      app_metadata: {
        role: 'staff',
        provider: 'email',
      },
    })

    if (error) {
      console.error('❌ Error creating staff user:', error.message)
      process.exit(1)
    }

    console.log('✅ Staff user created successfully!')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 User ID:', data.user?.id)
    console.log('🚫 Restricted: Cannot access Reports page')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

seedStaff()
