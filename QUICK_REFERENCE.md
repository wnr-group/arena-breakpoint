# Break Point Arena - Quick Reference Guide

## Schema Changes Summary

### What Changed?

**OLD DESIGN:**
- ❌ Bookings could only have ONE device slot
- ❌ Food orders were part of booking as JSON addons
- ❌ No way to group multiple bookings for payment
- ❌ Redis required for slot locking

**NEW DESIGN:**
- ✅ Bookings are flexible (device + food, or just one)
- ✅ One booking can have MULTIPLE device slots
- ✅ Food items in separate table with kitchen workflow
- ✅ Payment groups for batch collection
- ✅ Database-only locking (no Redis!)

---

## Table Relationships

```
devices (1) ←------ (N) booking_device_slots
                            ↓
                        bookings (1) ←------ (N) booking_food_items
                            ↓                          ↓
                        payment_groups            menu_items
                            ↓
                        admin_users
```

---

## Key Tables

### bookings
**Purpose:** Main booking entity  
**Contains:** Customer info, payment status, totals  
**Relations:** 
- Has many `booking_device_slots`
- Has many `booking_food_items`
- Belongs to `payment_groups` (optional)

### booking_device_slots
**Purpose:** Individual device slot reservations  
**Uniqueness:** `(device_id, slot_date, slot_start_time)` - prevents double booking  
**Lock logic:** Only counts if booking status is 'locked', 'confirmed', or 'checked_in'

### booking_food_items
**Purpose:** Food orders within a booking  
**Status:** pending → preparing → ready → served

### payment_groups
**Purpose:** Batch payment collection  
**Use case:** Admin collects ₹950 for 4 bookings in one transaction

---

## Common Queries

### Check Slot Availability
```sql
SELECT check_slot_available(
  'device-uuid'::UUID,
  '2026-05-30'::DATE,
  '14:00'::TIME
); -- Returns true/false
```

### Generate Booking Number
```sql
SELECT generate_booking_number(); -- Returns 'BP-20260530-001'
```

### Find Customer's Unpaid Bookings
```sql
SELECT * FROM bookings
WHERE customer_phone = '9876543210'
  AND payment_status = 'pending'
  AND status IN ('confirmed', 'checked_in');
```

### Today's Revenue
```sql
SELECT 
  SUM(total_amount) as revenue,
  COUNT(*) as paid_bookings
FROM bookings
WHERE payment_status = 'paid'
  AND DATE(created_at) = CURRENT_DATE;
```

### Expire Old Locks
```sql
SELECT expire_locked_bookings(); -- Returns count of expired
```

---

## Booking Scenarios Quick Reference

| Scenario | Device Slots | Food Items | Bookings Created |
|----------|--------------|------------|------------------|
| Simple booking | 1 | 0 | 1 |
| Booking + food | 1 | 2+ | 1 |
| Extension | 1 more | 0 | 1 new |
| Food order only | 0 | 2+ | 1 new |
| Multiple devices | 2+ | Any | 1 |

**Admin collects payment:** Select all bookings → Create payment_group → Mark all as paid

---

## Lock States Reference

| Status | Lock Expiry | Blocks Slot? | User Action |
|--------|-------------|--------------|-------------|
| `draft` | NULL | ❌ No | Creating booking |
| `locked` | +10 min | ✅ Yes | Payment pending |
| `locked` (expired) | Past | ❌ No | System auto-ignores |
| `confirmed` | NULL | ✅ Yes | Paid, waiting to play |
| `checked_in` | NULL | ✅ Yes | Currently playing |
| `completed` | NULL | ❌ No | Session finished |
| `cancelled` | NULL | ❌ No | Cancelled |
| `expired` | NULL | ❌ No | Lock timeout |

---

## Payment Flow Quick Guide

### Online (Customer)
1. Create booking with `status='locked'`, `lock_expires_at=NOW()+10min`
2. Customer pays via Razorpay
3. Update booking: `status='confirmed'`, `payment_status='paid'`, `lock_expires_at=NULL`

### Offline (Admin)
1. Create booking with `status='confirmed'`, `payment_status='pending'`
2. Customer plays
3. Admin creates `payment_group`, links bookings
4. Update bookings: `payment_status='paid'`

---

## Environment Variables

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay (optional for dev)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-test-key
RAZORPAY_KEY_SECRET=your-test-secret

# MSG91 (optional for dev)
MSG91_AUTH_KEY=your-key
MSG91_SENDER_ID=your-sender
MSG91_TEMPLATE_ID_OTP=your-template
```

### Removed
~~UPSTASH_REDIS_REST_URL~~ - Not needed anymore!  
~~UPSTASH_REDIS_REST_TOKEN~~ - Not needed anymore!

---

## Migration Commands

### Apply All Migrations
```bash
npx supabase db reset
```

### Create New Migration
```bash
npx supabase migration new migration_name
```

### Check Current Schema
```bash
npx supabase db diff
```

---

## Helper Functions Reference

### generate_booking_number()
**Returns:** `BP-YYYYMMDD-XXX`  
**Usage:** Auto-incrementing daily sequence

### generate_payment_group_number()
**Returns:** `PG-YYYYMMDD-XXX`  
**Usage:** Payment group identifier

### check_slot_available(device_id, date, time)
**Returns:** Boolean  
**Usage:** Check if slot is free (respects locks)

### expire_locked_bookings()
**Returns:** Integer (count expired)  
**Usage:** Cleanup expired locks (optional cron)

---

## File Structure

```
supabase/
  migrations/
    20260530092146_redesigned_schema.sql  ← New schema
    
SCHEMA_DESIGN.md        ← Complete schema documentation
BOOKING_FLOWS.md        ← All booking scenarios with code
QUICK_REFERENCE.md      ← This file
```

---

## Testing Checklist

### Database
- [ ] All tables created
- [ ] Indexes in place
- [ ] RLS policies working
- [ ] Helper functions working
- [ ] Unique constraints prevent double booking

### Booking Flow
- [ ] Can create device-only booking
- [ ] Can create food-only booking
- [ ] Can create device + food booking
- [ ] Lock expires after 10 minutes
- [ ] Expired locks don't block slots
- [ ] Can't double-book same slot

### Payment
- [ ] Online payment marks booking as paid
- [ ] Admin can create payment group
- [ ] Multiple bookings link to payment group
- [ ] Payment group shows in admin dashboard

### Admin
- [ ] Can search bookings by phone
- [ ] Can see unpaid bookings
- [ ] Can collect payment for multiple bookings
- [ ] Can scan QR code to check in

---

## Quick Troubleshooting

### Slot shows unavailable but shouldn't be
```sql
-- Check what's blocking it
SELECT 
  b.booking_number,
  b.status,
  b.lock_expires_at,
  bds.slot_start_time
FROM booking_device_slots bds
JOIN bookings b ON b.id = bds.booking_id
WHERE bds.device_id = 'device-uuid'
  AND bds.slot_date = '2026-05-30'
  AND bds.slot_start_time = '14:00';
```

### Locks not expiring
```sql
-- Manually expire
UPDATE bookings
SET status = 'expired'
WHERE status = 'locked'
  AND lock_expires_at < NOW();
```

### Customer has duplicate bookings
```sql
-- Check bookings by phone
SELECT 
  booking_number,
  status,
  payment_status,
  total_amount,
  created_at
FROM bookings
WHERE customer_phone = '9876543210'
ORDER BY created_at DESC;
```

---

## Next Steps

1. **Apply migrations**: `npx supabase db reset`
2. **Test booking flow**: Create sample booking via Supabase Studio
3. **Update app code**: Adapt to new schema
4. **Test payment groups**: Create multiple bookings, group them
5. **Build admin UI**: Payment group collection interface

---

**Need help?** See `SCHEMA_DESIGN.md` or `BOOKING_FLOWS.md` for detailed explanations.
