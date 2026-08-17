/** Temp: does the plan-summary query + date maths produce the right badge text? */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { arenaToday, daysBetweenDates, formatDateForDisplay } from '../lib/utils/dates'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m) process.env[m[1]] ||= m[2].replace(/^["']|["']$/g, '')
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  const today = arenaToday()
  console.log(`arena today: ${today}\n`)

  // Every customer holding an active_subscription_id, as the action resolves it.
  const { data: customers } = await db
    .from('customers')
    .select('phone, active_subscription_id')
    .not('active_subscription_id', 'is', null)

  console.log(`customers with an active_subscription_id: ${(customers || []).length}`)

  for (const c of customers || []) {
    // The exact select from getMyActivePlanSummary()
    const { data, error } = await db
      .from('subscriptions')
      .select('end_date, plan:subscription_plans(name, discount_percentage)')
      .eq('id', c.active_subscription_id)
      .eq('status', 'active')
      .gte('end_date', today)
      .maybeSingle()

    if (error) {
      console.log(`  ${c.phone}: ERROR ${error.message}`)
      continue
    }

    const plan = (data as any)?.plan
    if (!data?.end_date || !plan) {
      console.log(`  ${c.phone}: no active plan -> badge hidden`)
      continue
    }

    const daysRemaining = Math.max(0, daysBetweenDates(today, data.end_date) ?? 0)

    console.log(`  ${c.phone}:`)
    console.log(`     header badge : ${plan.name} · ${plan.discount_percentage}% off`)
    console.log(`     banner line  : Valid until ${formatDateForDisplay(data.end_date)} · ${daysRemaining} day(s) left`)
  }

  // Sanity-check the helper at the boundaries.
  console.log('\ndaysBetweenDates sanity:')
  console.log(`  today -> today            = ${daysBetweenDates(today, today)}  (expect 0, shows "last day")`)
  console.log(`  2026-08-17 -> 2026-09-17  = ${daysBetweenDates('2026-08-17', '2026-09-17')}  (expect 31)`)
  console.log(`  2026-08-17 -> 2026-08-16  = ${daysBetweenDates('2026-08-17', '2026-08-16')}  (expect -1, clamped to 0)`)
  console.log(`  garbage                   = ${daysBetweenDates('nope', today)}  (expect null)`)
}

main().catch(e => { console.error('fatal:', e.message); process.exit(1) })
