# Schema Migration Changelog

## Migration: 20260530092146_redesigned_schema.sql

**Date:** May 30, 2026  
**Type:** Complete redesign  
**Breaking Changes:** Yes

---

## Summary of Changes

Complete schema redesign to support:
1. ✅ Unified bookings (device slots + food orders in one booking)
2. ✅ Multiple bookings per customer with batch payment collection
3. ✅ Database-only slot locking (removed Redis dependency)
4. ✅ Payment groups for admin to collect payment for multiple bookings together

---

## Tables Dropped

```sql
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
```

**Reason:** Complete restructuring of relationships

---

## Tables Added

### New Tables

1. **admin_users**
   - Purpose: Admin authentication and user management
   - Key fields: username, password_hash, role, is_active

2. **payment_groups**
   - Purpose: Group multiple bookings for batch payment collection
   - Key fields: group_number, total_amount, payment_method, collected_by_admin_id
   - Relations: Has many bookings

3. **promo_codes**
   - Purpose: Discount code management
   - Key fields: code, discount_type, discount_value, validity dates
   - Relations: Referenced by bookings

4. **subscriptions**
   - Purpose: Subscription plan definitions
   - Key fields: name, price, duration_days, discount percentages

5. **subscription_purchases**
   - Purpose: Customer subscription purchases
   - Key fields: customer_phone, starts_at, expires_at, discount snapshots
   - Relations: References subscriptions

6. **booking_device_slots**
   - Purpose: Individual device slot reservations within a booking
   - Key fields: booking_id, device_id, slot_date, slot_start_time
   - **UNIQUE constraint:** `(device_id, slot_date, slot_start_time)` - prevents double booking
   - Relations: Belongs to bookings and devices

7. **booking_food_items**
   - Purpose: Food orders within a booking
   - Key fields: booking_id, menu_item_id, quantity, status
   - Relations: Belongs to bookings and menu_items

---

## Tables Recreated (with changes)

### devices
**Changes:**
- Removed `quantity` field (each device is a separate row now)
- `hourly_rate` is now NOT NULL
- Improved indexes

### menu_items
**Changes:**
- Removed `quantity` field (inventory tracking simplified)
- `price` and `status` constraints improved

### bookings (completely redesigned)
**Old structure:**
- Had `device_id` (single device only)
- Had `device_name`, `device_type`, `hourly_rate` (denormalized)
- Had `selected_date`, `selected_slot`, `slot_start_time`, `slot_end_time`
- Had `addons` JSONB field (food items mixed in)
- Had `slot_lock_expiry` BIGINT
- Status: `soft_locked`, `confirmed`, `cancelled`, `completed`

**New structure:**
- NO `device_id` (moved to `booking_device_slots` - supports multiple devices)
- Added `booking_number` TEXT (human-readable: BP-20260530-001)
- Added `customer_name`, `customer_email` (more customer info)
- Added `status` with more states: `draft`, `locked`, `confirmed`, `checked_in`, `completed`, `cancelled`, `expired`
- Added `lock_expires_at` TIMESTAMPTZ (replaced BIGINT)
- Added `locked_by` TEXT ('customer' or 'admin')
- Added `payment_group_id` (link to payment groups)
- Added `payment_status`: `pending`, `partial`, `paid`, `refunded`
- Separated subtotals: `device_subtotal`, `food_subtotal`
- Added `subscription_discount`, `promo_discount`, `promo_code_id`
- Added `notes` (admin notes)
- Added `qr_code_data` (QR payload)
- Added `checked_in_at`, `completed_at` timestamps

---

## Key Schema Improvements

### 1. Flexible Booking Model

**Old:** One booking = one device slot (+ food as JSON addon)

**New:** One booking can contain:
- Multiple device slots (via `booking_device_slots`)
- Multiple food items (via `booking_food_items`)
- Just device slots (no food)
- Just food items (no devices)
- Both device slots and food items

### 2. Payment Groups

**Old:** Each booking paid separately, no way to group payments

**New:** 
- Admin can select multiple bookings
- Create a `payment_group`
- All selected bookings link to the group
- Single payment transaction for all

**Example:**
```
Payment Group: PG-20260530-001 (₹950 cash)
├── Booking BP-20260530-001 (₹400 - 2hr PS5)
├── Booking BP-20260530-002 (₹200 - 1hr extension)
├── Booking BP-20260530-003 (₹250 - food order)
└── Booking BP-20260530-004 (₹100 - more food)
```

### 3. Database-Only Locking

**Old:** Required Redis for slot locking

**New:**
- `UNIQUE(device_id, slot_date, slot_start_time)` constraint prevents double booking at database level
- `lock_expires_at` TIMESTAMPTZ field for soft locks
- Query-time lock expiry checking (no background jobs needed)
- Helper function `check_slot_available()` encapsulates logic

**Lock Logic:**
```sql
-- A slot is blocked if there exists a booking where:
-- 1. Same device, date, and start time
-- 2. Status is 'locked', 'confirmed', or 'checked_in'
-- 3. If status is 'locked', lock_expires_at must be in the future
```

### 4. Better Status Tracking

**Old:** 4 statuses (soft_locked, confirmed, cancelled, completed)

**New:** 7 statuses with clearer semantics
- `draft` - Booking being created
- `locked` - Soft lock (payment pending)
- `confirmed` - Paid, waiting to play
- `checked_in` - Customer arrived (QR scanned)
- `completed` - Session finished
- `cancelled` - Cancelled
- `expired` - Lock timeout

### 5. Food Order Workflow

**Old:** Food items in JSONB array, no status tracking

**New:** Separate `booking_food_items` table with:
- Individual line items
- Quantity tracking
- Status: `pending` → `preparing` → `ready` → `served`
- Special instructions field
- Kitchen workflow support

---

## Helper Functions Added

### generate_booking_number()
Generates sequential booking numbers: `BP-20260530-001`, `BP-20260530-002`, etc.

### generate_payment_group_number()
Generates payment group numbers: `PG-20260530-001`, `PG-20260530-002`, etc.

### check_slot_available(device_id, date, time)
Returns TRUE if slot is available, FALSE if blocked.  
Respects lock expiry times.

### expire_locked_bookings()
Updates expired locks from `locked` to `expired`.  
Returns count of expired bookings.  
Can be called periodically or handled at query time.

---

## Index Changes

### New Indexes

**Performance-critical:**
```sql
-- Slot availability checks (hot path)
CREATE INDEX idx_device_slots_availability 
  ON booking_device_slots(device_id, slot_date, slot_start_time);

-- Lock expiry queries
CREATE INDEX idx_bookings_lock_expiry 
  ON bookings(lock_expires_at)
  WHERE status = 'locked' AND lock_expires_at IS NOT NULL;
```

**Search & reporting:**
```sql
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_group ON bookings(payment_group_id);
CREATE INDEX idx_subscription_purchases_customer 
  ON subscription_purchases(customer_phone, is_active);
CREATE INDEX idx_food_items_status ON booking_food_items(status);
```

---

## RLS Policy Changes

All tables now have proper RLS policies:

**Public access:**
- SELECT on devices, menu_items, bookings, subscriptions, promo_codes

**Authenticated only:**
- All operations on admin_users, payment_groups
- INSERT/UPDATE/DELETE on devices, menu_items

**Mixed:**
- Bookings: Public INSERT (customer booking), admin UPDATE
- Food items: Public INSERT, admin UPDATE (kitchen workflow)

---

## Migration Risks & Considerations

### Breaking Changes
⚠️ **All existing bookings data will be lost** (DROP TABLE CASCADE)  
⚠️ **App code needs to be updated** to work with new schema  
⚠️ **Redis integration code should be removed**

### Safe to Migrate Because
✅ Project is in early development (no production data)  
✅ Schema was incomplete (migrations not fully applied)  
✅ New design is more scalable and feature-complete

### Data Migration (if needed)
If old data exists:
1. Export old bookings to CSV
2. Apply new schema
3. Import bookings using new structure (map old → new fields)
4. Generate booking numbers for old data

---

## Post-Migration Steps

### 1. Verify Schema
```bash
npx supabase db diff --use-migra
```

### 2. Test Core Functions
```sql
-- Test booking number generation
SELECT generate_booking_number();

-- Test slot availability
SELECT check_slot_available(
  'some-device-uuid'::UUID,
  CURRENT_DATE,
  '14:00'::TIME
);

-- Test lock expiry
SELECT expire_locked_bookings();
```

### 3. Seed Data (Optional)
```sql
-- Insert sample devices
INSERT INTO devices (type, station_number, hourly_rate) VALUES
  ('PS5', 'PS5-001', 200.00),
  ('PS5', 'PS5-002', 200.00),
  ('Standard Snooker', 'SNOOKER-001', 150.00);

-- Insert sample menu items
INSERT INTO menu_items (name, category, price) VALUES
  ('Chips', 'Snacks', 50.00),
  ('Coke', 'Drinks', 50.00),
  ('Burger', 'Meals', 150.00);

-- Insert sample subscription
INSERT INTO subscriptions (name, price, duration_days, device_discount_percentage) VALUES
  ('Monthly Pass', 999.00, 30, 20.0);
```

### 4. Update App Code
- Remove Redis client code
- Update booking creation logic
- Add payment group UI for admin
- Update booking list queries
- Add food order status tracking

---

## Rollback Plan

If migration fails or issues discovered:

```bash
# Stop Supabase
npx supabase stop

# Remove new migration
rm supabase/migrations/20260530092146_redesigned_schema.sql

# Restart with old schema
npx supabase start
```

**Note:** This assumes no data loss is acceptable (early dev phase).

---

## References

- **Complete Schema:** See `SCHEMA_DESIGN.md`
- **Usage Examples:** See `BOOKING_FLOWS.md`
- **Quick Reference:** See `QUICK_REFERENCE.md`

---

## Approval

- [x] Schema reviewed
- [x] Breaking changes documented
- [x] Rollback plan defined
- [ ] Tested in local environment
- [ ] App code updated
- [ ] Ready for production (when applicable)

---

**Migration Author:** Claude Code  
**Migration Date:** May 30, 2026  
**Status:** Applied ✅
