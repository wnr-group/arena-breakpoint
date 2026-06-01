# Break Point Arena - Database Schema Design

## Overview

This document describes the complete database schema for the Break Point Arena gaming café platform.

## Key Requirements

1. **Unified Bookings**: Each booking can include device slot reservations AND food orders
2. **Payment Groups**: Admin can mark multiple bookings as paid together
3. **Database-Only Locking**: Slot locking handled entirely in PostgreSQL (no Redis)
4. **Admin Flexibility**: Collect payment for multiple bookings in one transaction

## Core Entities

### 1. Devices Table
Gaming devices available for booking (PS5, Snooker tables, etc.)

```sql
CREATE TABLE public.devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('PS5', 'Standard Snooker', 'Medium Snooker', 'American Snooker')),
  station_number TEXT NOT NULL UNIQUE,
  specs TEXT,
  hourly_rate NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  status TEXT DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance', 'inactive')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_devices_status ON public.devices(status) WHERE status = 'available';
```

**Notes:**
- `hourly_rate`: Price per hour for this device type
- `status`: Current operational status
- Removed `quantity` field - each physical device gets its own row

---

### 2. Menu Items Table
Food and beverage items available for ordering

```sql
CREATE TABLE public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Snacks', 'Drinks', 'Meals')),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock', 'hidden')),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_menu_items_category_status ON public.menu_items(category, status);
```

**Notes:**
- Removed `quantity` field - stock tracking is optional for Phase 1
- Can add inventory tracking later if needed

---

### 3. Bookings Table (Main)
Central booking entity - can contain device slots AND/OR food orders

```sql
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT UNIQUE NOT NULL, -- Human-readable: BP-20260530-001
  
  -- Customer Information
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Booking Status
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN (
    'draft',          -- Created but not locked yet
    'locked',         -- Slot locked, awaiting payment
    'confirmed',      -- Payment received
    'checked_in',     -- Customer arrived (QR scanned)
    'completed',      -- Session finished
    'cancelled',      -- Cancelled by customer/admin
    'expired'         -- Lock expired without payment
  )),
  
  -- Lock Management (Database-based)
  lock_expires_at TIMESTAMPTZ, -- NULL means no lock, or permanent (confirmed)
  locked_by TEXT, -- 'customer' or 'admin' or NULL
  
  -- Payment Information
  payment_group_id UUID REFERENCES public.payment_groups(id) ON DELETE SET NULL,
  payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN (
    'pending',        -- Awaiting payment
    'partial',        -- Partially paid (in a group)
    'paid',           -- Fully paid
    'refunded'        -- Refunded
  )),
  
  -- Pricing
  device_subtotal NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  food_subtotal NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  subscription_discount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  promo_discount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  
  -- Metadata
  notes TEXT, -- Admin notes
  qr_code_data TEXT, -- QR code payload (booking_id + signature)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_lock CHECK (
    (status IN ('locked', 'draft') AND lock_expires_at IS NOT NULL) OR
    (status NOT IN ('locked', 'draft') AND lock_expires_at IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_phone ON public.bookings(customer_phone);
CREATE INDEX idx_bookings_lock_expiry ON public.bookings(lock_expires_at) 
  WHERE status = 'locked' AND lock_expires_at IS NOT NULL;
CREATE INDEX idx_bookings_payment_group ON public.bookings(payment_group_id) 
  WHERE payment_group_id IS NOT NULL;
CREATE UNIQUE INDEX idx_booking_number ON public.bookings(booking_number);
```

**Notes:**
- **Unified booking**: Handles both device slots and food orders
- **Lock management**: `lock_expires_at` + `status='locked'` = soft lock
- **Payment groups**: Links to `payment_groups` for batch payments
- **booking_number**: Human-readable identifier (BP-20260530-001)

---

### 4. Booking Device Slots Table
Device slot reservations within a booking (one-to-many)

```sql
CREATE TABLE public.booking_device_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
  
  -- Slot Details
  slot_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_end_time TIME NOT NULL,
  duration_hours NUMERIC(3, 2) NOT NULL, -- e.g., 1.5 hours
  
  -- Pricing (snapshot at booking time)
  hourly_rate NUMERIC(10, 2) NOT NULL,
  slot_total NUMERIC(10, 2) NOT NULL, -- hourly_rate * duration_hours
  
  -- Device info snapshot (for display even if device deleted)
  device_type TEXT NOT NULL,
  device_station_number TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent double booking: one device, one slot, one date
  UNIQUE(device_id, slot_date, slot_start_time)
);

-- Critical index for slot availability checks
CREATE INDEX idx_device_slots_availability ON public.booking_device_slots(
  device_id, slot_date, slot_start_time
) WHERE booking_id IN (
  SELECT id FROM public.bookings 
  WHERE status IN ('locked', 'confirmed', 'checked_in')
);
```

**Notes:**
- **One booking can have multiple device slots** (e.g., 2 PS5s for 2 hours each)
- **UNIQUE constraint prevents double booking** at database level
- **Snapshot fields**: Store device info at time of booking
- **Only active bookings block slots**: draft/expired don't count

---

### 5. Booking Food Items Table
Food orders within a booking (one-to-many)

```sql
CREATE TABLE public.booking_food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  
  -- Order Details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL, -- Price at time of order
  line_total NUMERIC(10, 2) NOT NULL, -- quantity * unit_price
  
  -- Menu item snapshot
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  
  -- Fulfillment
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN (
    'pending',    -- Order placed
    'preparing',  -- Kitchen preparing
    'ready',      -- Ready for pickup
    'served',     -- Delivered to customer
    'cancelled'   -- Cancelled
  )),
  
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_food_items_booking ON public.booking_food_items(booking_id);
CREATE INDEX idx_food_items_status ON public.booking_food_items(status);
```

**Notes:**
- **Food orders are part of a booking**, not standalone
- **Quantity-based**: Multiple of same item
- **Status tracking**: Kitchen workflow management
- **Price snapshot**: Store price at order time (menu prices may change)

---

### 6. Payment Groups Table
Groups multiple bookings for batch payment collection

```sql
CREATE TABLE public.payment_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_number TEXT UNIQUE NOT NULL, -- PG-20260530-001
  
  -- Payment Details
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'online')),
  payment_status TEXT DEFAULT 'pending' NOT NULL CHECK (payment_status IN (
    'pending',
    'paid',
    'refunded'
  )),
  
  -- Transaction Info
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  transaction_reference TEXT, -- For offline payments
  
  -- Admin tracking
  collected_by_admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  payment_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_groups_status ON public.payment_groups(payment_status);
CREATE INDEX idx_payment_groups_collected_by ON public.payment_groups(collected_by_admin_id);
```

**Notes:**
- **Admin creates payment group** by selecting multiple bookings
- **Single payment** for multiple bookings
- **Tracks payment method**: online (Razorpay) or offline (cash/card/UPI)
- **Admin audit trail**: Who collected the payment

---

### 7. Promo Codes Table
Discount codes for customers

```sql
CREATE TABLE public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  
  -- Discount Configuration
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  max_discount NUMERIC(10, 2), -- For percentage discounts
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER, -- NULL = unlimited
  usage_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Applicability
  min_order_amount NUMERIC(10, 2),
  applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'devices', 'food')),
  
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT valid_dates CHECK (valid_until > valid_from),
  CONSTRAINT valid_usage CHECK (usage_limit IS NULL OR usage_count <= usage_limit)
);

CREATE UNIQUE INDEX idx_promo_code ON public.promo_codes(UPPER(code));
CREATE INDEX idx_promo_active ON public.promo_codes(is_active, valid_from, valid_until);
```

**Notes:**
- **Percentage or fixed discount**
- **Time-limited and usage-limited**
- **Can apply to devices, food, or both**
- **Case-insensitive codes** (uppercase index)

---

### 8. Subscriptions Table
Subscription plans available for purchase

```sql
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  
  -- Benefits
  device_discount_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (device_discount_percentage >= 0 AND device_discount_percentage <= 100),
  food_discount_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (food_discount_percentage >= 0 AND food_discount_percentage <= 100),
  
  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_active ON public.subscriptions(is_active, display_order);
```

**Notes:**
- **Monthly/yearly plans**: Defined by `duration_days`
- **Separate discounts**: For devices and food
- **Display order**: For sorting plans in UI

---

### 9. Subscription Purchases Table
User subscription purchases

```sql
CREATE TABLE public.subscription_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  
  -- Customer
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  
  -- Validity
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Payment
  amount_paid NUMERIC(10, 2) NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Snapshot at purchase time
  device_discount_percentage NUMERIC(5, 2) NOT NULL,
  food_discount_percentage NUMERIC(5, 2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT valid_period CHECK (expires_at > starts_at)
);

CREATE INDEX idx_subscription_purchases_customer ON public.subscription_purchases(customer_phone, is_active);
CREATE INDEX idx_subscription_purchases_validity ON public.subscription_purchases(expires_at, is_active);
```

**Notes:**
- **Per customer**: Linked by phone number
- **Time-bound**: Has start and end dates
- **Discount snapshot**: Store discount % at purchase time
- **Can check active subscription** by phone + current date

---

### 10. Admin Users Table
Admin dashboard users

```sql
CREATE TABLE public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_admin_username ON public.admin_users(LOWER(username));
```

**Notes:**
- **Role-based access** (implement in app logic)
- **Password hash only**, never plain text
- **Active/inactive status** for disabling accounts

---

## Database-Based Slot Locking Flow

### How It Works (No Redis Needed)

#### 1. Customer Selects Slot
```sql
-- Check if slot is available
SELECT COUNT(*) FROM public.booking_device_slots bds
JOIN public.bookings b ON b.id = bds.booking_id
WHERE bds.device_id = $1
  AND bds.slot_date = $2
  AND bds.slot_start_time = $3
  AND b.status IN ('locked', 'confirmed', 'checked_in')
  AND (b.lock_expires_at IS NULL OR b.lock_expires_at > NOW());

-- If count = 0, slot is available
```

#### 2. Create Booking with Lock
```sql
BEGIN;

-- Create booking in locked state
INSERT INTO public.bookings (
  booking_number,
  customer_phone,
  status,
  lock_expires_at,
  locked_by,
  total_amount
) VALUES (
  'BP-20260530-001',
  '9876543210',
  'locked',
  NOW() + INTERVAL '10 minutes', -- 10-minute lock
  'customer',
  500.00
) RETURNING id;

-- Insert device slot
INSERT INTO public.booking_device_slots (
  booking_id,
  device_id,
  slot_date,
  slot_start_time,
  slot_end_time,
  duration_hours,
  hourly_rate,
  slot_total,
  device_type,
  device_station_number
) VALUES (...);

COMMIT;
```

**Lock prevents other bookings:**
- The `UNIQUE(device_id, slot_date, slot_start_time)` constraint prevents double booking
- Only bookings with `status IN ('locked', 'confirmed', 'checked_in')` count as active

#### 3. Auto-Expire Locks
Run a periodic job (cron or pg_cron):

```sql
-- Update expired locks
UPDATE public.bookings
SET status = 'expired'
WHERE status = 'locked'
  AND lock_expires_at < NOW();
```

Or handle at query time:

```sql
-- When checking availability, ignore expired locks
SELECT COUNT(*) FROM public.booking_device_slots bds
JOIN public.bookings b ON b.id = bds.booking_id
WHERE bds.device_id = $1
  AND bds.slot_date = $2
  AND bds.slot_start_time = $3
  AND b.status IN ('locked', 'confirmed', 'checked_in')
  AND (
    b.status != 'locked' OR 
    b.lock_expires_at > NOW()
  );
```

#### 4. Confirm Booking (After Payment)
```sql
UPDATE public.bookings
SET 
  status = 'confirmed',
  lock_expires_at = NULL, -- Remove expiry
  payment_status = 'paid'
WHERE id = $1;
```

---

## Admin Payment Group Flow

### Scenario: Customer plays for 2 hours, orders food, then extends for 1 more hour

#### Step 1: Initial Booking
```sql
-- Booking 1: 2-hour PS5 slot + snacks
INSERT INTO bookings (booking_number, customer_phone, status, device_subtotal, food_subtotal, total_amount)
VALUES ('BP-001', '9876543210', 'confirmed', 400, 100, 500);

INSERT INTO booking_device_slots (booking_id, device_id, slot_date, slot_start_time, duration_hours, slot_total)
VALUES ('booking-1-uuid', 'ps5-1-uuid', '2026-05-30', '14:00', 2.0, 400);

INSERT INTO booking_food_items (booking_id, menu_item_id, quantity, unit_price, line_total, item_name)
VALUES ('booking-1-uuid', 'chips-uuid', 2, 50, 100, 'Chips');
```

#### Step 2: Customer Extends Session
```sql
-- Booking 2: 1 more hour on same PS5
INSERT INTO bookings (booking_number, customer_phone, status, device_subtotal, total_amount)
VALUES ('BP-002', '9876543210', 'confirmed', 200, 200);

INSERT INTO booking_device_slots (booking_id, device_id, slot_date, slot_start_time, duration_hours, slot_total)
VALUES ('booking-2-uuid', 'ps5-1-uuid', '2026-05-30', '16:00', 1.0, 200);
```

#### Step 3: Customer Orders More Food
```sql
-- Booking 3: Just food (no device slot)
INSERT INTO bookings (booking_number, customer_phone, status, food_subtotal, total_amount)
VALUES ('BP-003', '9876543210', 'confirmed', 150, 150);

INSERT INTO booking_food_items (booking_id, menu_item_id, quantity, unit_price, line_total, item_name)
VALUES ('booking-3-uuid', 'burger-uuid', 1, 150, 150, 'Burger');
```

#### Step 4: Admin Creates Payment Group
```sql
BEGIN;

-- Create payment group
INSERT INTO payment_groups (
  group_number,
  total_amount,
  payment_method,
  payment_status,
  collected_by_admin_id,
  transaction_reference
) VALUES (
  'PG-20260530-001',
  850.00, -- 500 + 200 + 150
  'cash',
  'paid',
  'admin-uuid',
  'CASH-001'
) RETURNING id;

-- Link all bookings to payment group
UPDATE bookings
SET 
  payment_group_id = 'payment-group-uuid',
  payment_status = 'paid'
WHERE id IN ('booking-1-uuid', 'booking-2-uuid', 'booking-3-uuid');

COMMIT;
```

**Admin UI Workflow:**
1. Search bookings by customer phone
2. Select multiple unpaid bookings
3. Click "Collect Payment Together"
4. Enter payment method (cash/card/UPI)
5. System creates payment group and marks all bookings as paid

---

## Key Features of This Design

### ✅ Unified Bookings
- Each booking can have:
  - Device slots only
  - Food orders only  
  - Both device slots AND food
- Admin flexibility: Create any combination

### ✅ Payment Groups
- Admin selects 2, 3, or more bookings
- Collect single payment for all
- All bookings link to one `payment_group`
- Audit trail: Who collected, when, how much

### ✅ Database-Only Locking
- No Redis dependency
- UNIQUE constraint prevents double-booking
- Lock expiry handled by `lock_expires_at` timestamp
- Query-time or cron-based expiry
- Simpler ops, easier to reason about

### ✅ Scalability
- Indexes on critical paths
- Proper foreign keys and cascades
- Room for future features (memberships, loyalty points, etc.)

---

## Indexes Summary

Critical indexes for performance:

```sql
-- Slot availability checks (hot path)
CREATE INDEX idx_device_slots_availability ON booking_device_slots(device_id, slot_date, slot_start_time);

-- Lock expiry cleanup
CREATE INDEX idx_bookings_lock_expiry ON bookings(lock_expires_at) WHERE status = 'locked';

-- Customer lookup
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX idx_subscription_purchases_customer ON subscription_purchases(customer_phone, is_active);

-- Payment group queries
CREATE INDEX idx_bookings_payment_group ON bookings(payment_group_id);

-- Admin dashboard
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_food_items_status ON booking_food_items(status);
```

---

## Next Steps

1. **Create new migration** with this schema
2. **Update app code** to work with new structure
3. **Update admin UI** to support payment groups
4. **Test slot locking** thoroughly (race conditions)
5. **Migrate existing data** if any (current schema is simple, should be straightforward)


---

## 11. Customers Table (Added)

Centralized customer data table for better data management and relationships.

```sql
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(100),
  active_subscription_id UUID REFERENCES public.subscription_purchases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_active_subscription ON public.customers(active_subscription_id);
```

**Notes:**
- **Single source of truth** for customer data
- **One phone = one customer** (UNIQUE constraint)
- **active_subscription_id**: Quick reference to current subscription
- **Related tables updated**: `bookings` and `subscription_purchases` now have `customer_id` field

**Helper Functions:**
- `get_or_create_customer(phone, name?, email?)` - Get or create customer by phone
- `get_customer_active_subscription(customer_id)` - Get current subscription details
- `update_customer_active_subscription(customer_id)` - Refresh active subscription reference

**Benefits:**
- Fast customer lookup by phone
- Centralized customer profile
- Easy subscription eligibility check
- Reduced data duplication
- Better data integrity

See `CUSTOMERS_TABLE.md` for complete documentation.

