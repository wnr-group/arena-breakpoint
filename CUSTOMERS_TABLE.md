# Customers Table Documentation

## Overview

The `customers` table centralizes customer data and provides a single source of truth for customer information across the system.

## Table Structure

```sql
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  active_subscription_id UUID REFERENCES subscription_purchases(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Key Features

### 1. Single Customer Record
- **One customer = one phone number**
- Automatically links all bookings and subscriptions
- Maintains customer profile across sessions

### 2. Active Subscription Tracking
- `active_subscription_id` points to current active subscription
- Auto-updated when subscription purchased/expires
- Fast lookup for discount eligibility

### 3. Relationships

```
customers (1) ←────── (N) bookings
    ↓
    ├─────────────────── (N) subscription_purchases
    │
    └─── (1) active_subscription_id → subscription_purchases
```

## Usage Patterns

### Create or Get Customer

**Using helper function (recommended):**
```sql
SELECT get_or_create_customer(
  '9876543210',              -- phone (required)
  'John Doe',                -- name (optional)
  'john@example.com'         -- email (optional)
);
-- Returns: customer_id (UUID)
```

**Manual insert:**
```sql
INSERT INTO customers (phone, name, email)
VALUES ('9876543210', 'John Doe', 'john@example.com')
ON CONFLICT (phone) DO NOTHING
RETURNING id;
```

### Create Booking with Customer

**New approach (with customer_id):**
```sql
-- Step 1: Get or create customer
SELECT get_or_create_customer('9876543210', 'John Doe') INTO v_customer_id;

-- Step 2: Create booking
INSERT INTO bookings (
  booking_number,
  customer_id,           -- NEW: Reference customer
  customer_phone,        -- Keep for backward compatibility
  customer_name,
  total_amount,
  status
) VALUES (
  'BP-20260530-001',
  v_customer_id,
  '9876543210',
  'John Doe',
  500.00,
  'confirmed'
);
```

### Check Customer's Active Subscription

```sql
-- Get active subscription details
SELECT * FROM get_customer_active_subscription('customer-uuid');

-- Returns:
-- subscription_id | subscription_name | device_discount_% | food_discount_% | expires_at
-- uuid            | "Monthly Pass"    | 20.00             | 10.00           | 2026-06-30
```

### Find All Customer Bookings

```sql
SELECT
  b.booking_number,
  b.status,
  b.total_amount,
  b.created_at
FROM bookings b
WHERE b.customer_id = 'customer-uuid'
ORDER BY b.created_at DESC;
```

### Customer Profile with Stats

```sql
SELECT
  c.name,
  c.phone,
  c.email,
  c.created_at,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(b.total_amount) FILTER (WHERE b.payment_status = 'paid') as total_spent,
  COUNT(DISTINCT sp.id) as subscription_count,
  s.name as active_subscription_name
FROM customers c
LEFT JOIN bookings b ON b.customer_id = c.id
LEFT JOIN subscription_purchases sp ON sp.customer_id = c.id
LEFT JOIN subscription_purchases active_sp ON active_sp.id = c.active_subscription_id
LEFT JOIN subscriptions s ON s.id = active_sp.subscription_id
WHERE c.id = 'customer-uuid'
GROUP BY c.id, s.name;
```

## Helper Functions

### get_or_create_customer(phone, name?, email?)
**Purpose:** Get existing customer by phone or create new one  
**Returns:** UUID (customer_id)  
**Usage:**
```sql
SELECT get_or_create_customer('9876543210');
SELECT get_or_create_customer('9876543210', 'Jane Smith');
SELECT get_or_create_customer('9876543210', 'Jane Smith', 'jane@example.com');
```

### get_customer_active_subscription(customer_id)
**Purpose:** Get current active subscription details  
**Returns:** Table with subscription info or empty  
**Usage:**
```sql
SELECT * FROM get_customer_active_subscription('customer-uuid');
```

### update_customer_active_subscription(customer_id)
**Purpose:** Refresh active_subscription_id based on current subscriptions  
**Returns:** VOID  
**Usage:**
```sql
-- After subscription purchase
SELECT update_customer_active_subscription('customer-uuid');

-- Bulk refresh (cron job)
SELECT update_customer_active_subscription(id) FROM customers;
```

## Integration with Existing Tables

### bookings Table
**Added columns:**
- `customer_id UUID` - References customers table
- `customer_phone` - Kept for backward compatibility
- `customer_name` - Kept for display purposes

**Query pattern:**
```sql
-- New bookings should set both customer_id and customer_phone
INSERT INTO bookings (customer_id, customer_phone, customer_name, ...)
VALUES (v_customer_id, '9876543210', 'John Doe', ...);
```

### subscription_purchases Table
**Added columns:**
- `customer_id UUID` - References customers table
- `customer_phone` - Kept for backward compatibility

**After subscription purchase:**
```sql
-- 1. Create subscription purchase
INSERT INTO subscription_purchases (
  subscription_id,
  customer_id,
  customer_phone,
  ...
) VALUES (...) RETURNING id;

-- 2. Update customer's active subscription
SELECT update_customer_active_subscription(v_customer_id);
```

## Migration from Old Data

If you have existing bookings without `customer_id`:

```sql
-- Step 1: Create customers from bookings
INSERT INTO customers (phone, name, email)
SELECT DISTINCT
  customer_phone,
  COALESCE(customer_name, 'Customer'),
  customer_email
FROM bookings
WHERE customer_phone IS NOT NULL
  AND customer_phone != ''
ON CONFLICT (phone) DO NOTHING;

-- Step 2: Link bookings to customers
UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.customer_phone = c.phone
  AND b.customer_id IS NULL;

-- Step 3: Link subscription purchases to customers
UPDATE subscription_purchases sp
SET customer_id = c.id
FROM customers c
WHERE sp.customer_phone = c.phone
  AND sp.customer_id IS NULL;

-- Step 4: Update active subscriptions
SELECT update_customer_active_subscription(id)
FROM customers;
```

## Application Code Examples

### TypeScript/Next.js

**Create booking with customer:**
```typescript
import { supabase } from '@/lib/supabase/client';

async function createBooking(phone: string, name: string, bookingData: any) {
  // Get or create customer
  const { data: customerId } = await supabase.rpc('get_or_create_customer', {
    p_phone: phone,
    p_name: name,
    p_email: bookingData.email
  });

  // Create booking
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      booking_number: await generateBookingNumber(),
      customer_id: customerId,
      customer_phone: phone,
      customer_name: name,
      customer_email: bookingData.email,
      // ... rest of booking data
    })
    .select()
    .single();

  return booking;
}
```

**Check customer subscription:**
```typescript
async function getCustomerDiscount(customerId: string) {
  const { data: subscription } = await supabase
    .rpc('get_customer_active_subscription', {
      p_customer_id: customerId
    })
    .single();

  if (subscription) {
    return {
      deviceDiscount: subscription.device_discount_percentage,
      foodDiscount: subscription.food_discount_percentage,
      expiresAt: subscription.expires_at
    };
  }

  return null;
}
```

**Get customer profile:**
```typescript
async function getCustomerProfile(phone: string) {
  const { data: customer } = await supabase
    .from('customers')
    .select(`
      *,
      bookings(count),
      subscription_purchases(count),
      active_subscription:active_subscription_id(
        subscription_id,
        subscriptions(name, price)
      )
    `)
    .eq('phone', phone)
    .single();

  return customer;
}
```

## Admin Dashboard Queries

### Customer Search by Phone
```sql
SELECT
  c.id,
  c.name,
  c.phone,
  c.email,
  COUNT(b.id) as booking_count,
  SUM(b.total_amount) FILTER (WHERE b.payment_status = 'paid') as lifetime_value,
  s.name as active_subscription
FROM customers c
LEFT JOIN bookings b ON b.customer_id = c.id
LEFT JOIN subscription_purchases sp ON sp.id = c.active_subscription_id
LEFT JOIN subscriptions s ON s.id = sp.subscription_id
WHERE c.phone LIKE '%9876%'
GROUP BY c.id, s.name;
```

### Top Customers (by spend)
```sql
SELECT
  c.name,
  c.phone,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(b.total_amount) FILTER (WHERE b.payment_status = 'paid') as total_spent
FROM customers c
JOIN bookings b ON b.customer_id = c.id
WHERE b.payment_status = 'paid'
GROUP BY c.id
ORDER BY total_spent DESC
LIMIT 10;
```

### Customers with Active Subscriptions
```sql
SELECT
  c.name,
  c.phone,
  s.name as subscription_plan,
  sp.expires_at,
  sp.device_discount_percentage,
  sp.food_discount_percentage
FROM customers c
JOIN subscription_purchases sp ON sp.id = c.active_subscription_id
JOIN subscriptions s ON s.id = sp.subscription_id
WHERE sp.is_active = true
  AND sp.expires_at > NOW()
ORDER BY sp.expires_at;
```

## Benefits of Customers Table

### Before (without customers table)
```sql
-- Find customer's bookings: search by phone in bookings
-- Check subscription: search by phone in subscription_purchases
-- Customer info: scattered across bookings
-- Duplicate data: name/email repeated in every booking
```

### After (with customers table)
```sql
-- Find customer: one lookup by phone
-- Get all bookings: JOIN on customer_id (indexed)
-- Check subscription: customer.active_subscription_id (fast)
-- Customer info: single source of truth
-- No duplication: one customer record
```

### Performance Improvements
- ✅ Fast customer lookup by phone (indexed)
- ✅ Fast booking queries (JOIN on indexed customer_id)
- ✅ Instant subscription check (no date comparisons needed)
- ✅ Reduced data duplication
- ✅ Consistent customer data across bookings

### Data Integrity
- ✅ One phone = one customer (enforced by UNIQUE constraint)
- ✅ Customer info updates in one place
- ✅ Foreign keys prevent orphaned bookings
- ✅ Active subscription automatically tracked

## Summary

The customers table provides:
1. **Centralized customer data** - single source of truth
2. **Fast subscription checks** - active_subscription_id field
3. **Better relationships** - proper foreign keys to bookings and subscriptions
4. **Helper functions** - easy customer creation and subscription queries
5. **Backward compatibility** - old phone-based queries still work

All new booking and subscription code should use `customer_id` for linking, while keeping `customer_phone` for backward compatibility and display purposes.
