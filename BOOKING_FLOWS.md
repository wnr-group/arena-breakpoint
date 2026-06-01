# Break Point Arena - Booking & Payment Flows

This document describes the complete booking and payment workflows in the redesigned system.

## Overview

The system supports:
1. **Unified Bookings**: Device slots + food orders in one booking
2. **Flexible Ordering**: Create multiple bookings (device, food, or both)
3. **Batch Payments**: Admin can collect payment for multiple bookings together
4. **Database Locking**: Slot reservations handled entirely in PostgreSQL

---

## 1. Customer Booking Flow (Online)

### Scenario 1: Simple Device Booking

**Customer wants to book 1 PS5 for 2 hours**

```typescript
// Step 1: Check slot availability
const isAvailable = await supabase.rpc('check_slot_available', {
  p_device_id: 'ps5-uuid',
  p_slot_date: '2026-05-30',
  p_slot_start_time: '14:00'
});

if (!isAvailable) {
  return { error: 'Slot not available' };
}

// Step 2: Create booking with lock
const bookingNumber = await supabase.rpc('generate_booking_number');
// Returns: BP-20260530-001

const { data: booking } = await supabase
  .from('bookings')
  .insert({
    booking_number: bookingNumber,
    customer_phone: '9876543210',
    customer_name: 'John Doe',
    status: 'locked', // Soft lock for 10 minutes
    lock_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    locked_by: 'customer',
    device_subtotal: 400.00,
    food_subtotal: 0.00,
    total_amount: 400.00,
    payment_status: 'pending'
  })
  .select()
  .single();

// Step 3: Insert device slot
await supabase
  .from('booking_device_slots')
  .insert({
    booking_id: booking.id,
    device_id: 'ps5-uuid',
    slot_date: '2026-05-30',
    slot_start_time: '14:00',
    slot_end_time: '16:00',
    duration_hours: 2.0,
    hourly_rate: 200.00,
    slot_total: 400.00,
    device_type: 'PS5',
    device_station_number: 'PS5-001'
  });

// Step 4: Customer proceeds to payment
// ... Razorpay integration ...

// Step 5: After successful payment
await supabase
  .from('bookings')
  .update({
    status: 'confirmed',
    lock_expires_at: null, // Remove lock expiry
    payment_status: 'paid'
  })
  .eq('id', booking.id);
```

### Scenario 2: Device + Food Booking

**Customer books PS5 + orders snacks immediately**

```typescript
// Create booking
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    booking_number: 'BP-20260530-001',
    customer_phone: '9876543210',
    status: 'locked',
    lock_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    device_subtotal: 400.00,
    food_subtotal: 150.00, // Added food
    total_amount: 550.00
  })
  .select()
  .single();

// Insert device slot
await supabase.from('booking_device_slots').insert({
  booking_id: booking.id,
  // ... device slot details
});

// Insert food items
await supabase.from('booking_food_items').insert([
  {
    booking_id: booking.id,
    menu_item_id: 'chips-uuid',
    quantity: 2,
    unit_price: 50.00,
    line_total: 100.00,
    item_name: 'Chips',
    item_category: 'Snacks'
  },
  {
    booking_id: booking.id,
    menu_item_id: 'coke-uuid',
    quantity: 1,
    unit_price: 50.00,
    line_total: 50.00,
    item_name: 'Coke',
    item_category: 'Drinks'
  }
]);

// Payment and confirmation same as above
```

---

## 2. Walk-in Customer Flow (Admin Creates Booking)

### Scenario: Customer walks in without online booking

**Admin creates booking at counter**

```typescript
// Admin creates booking directly
const bookingNumber = await supabase.rpc('generate_booking_number');

const { data: booking } = await supabase
  .from('bookings')
  .insert({
    booking_number: bookingNumber,
    customer_phone: '9876543210',
    customer_name: 'Jane Smith',
    status: 'confirmed', // Direct confirmation (no lock)
    locked_by: 'admin',
    device_subtotal: 200.00,
    total_amount: 200.00,
    payment_status: 'pending' // Will collect later
  })
  .select()
  .single();

// Insert device slot
await supabase.from('booking_device_slots').insert({
  booking_id: booking.id,
  device_id: 'snooker-uuid',
  slot_date: TODAY,
  slot_start_time: NOW,
  slot_end_time: add1Hour(NOW),
  duration_hours: 1.0,
  // ...
});

// Customer plays, admin collects payment later
```

---

## 3. Extended Session Flow

### Scenario: Customer extends playing time

**Customer playing PS5, wants 1 more hour**

```typescript
// Create NEW booking for extension
const bookingNumber = await supabase.rpc('generate_booking_number');

const { data: extensionBooking } = await supabase
  .from('bookings')
  .insert({
    booking_number: bookingNumber,
    customer_phone: '9876543210', // Same customer
    customer_name: 'John Doe',
    status: 'confirmed',
    device_subtotal: 200.00,
    total_amount: 200.00,
    payment_status: 'pending'
  })
  .select()
  .single();

// Insert device slot (next hour on same device)
await supabase.from('booking_device_slots').insert({
  booking_id: extensionBooking.id,
  device_id: 'ps5-uuid', // Same device
  slot_date: '2026-05-30',
  slot_start_time: '16:00', // Next slot
  slot_end_time: '17:00',
  duration_hours: 1.0,
  slot_total: 200.00,
  // ...
});

// Payment collected later along with original booking
```

---

## 4. Food-Only Booking

### Scenario: Customer only orders food (no device)

**Customer already playing, orders more food**

```typescript
const bookingNumber = await supabase.rpc('generate_booking_number');

const { data: foodBooking } = await supabase
  .from('bookings')
  .insert({
    booking_number: bookingNumber,
    customer_phone: '9876543210',
    status: 'confirmed',
    device_subtotal: 0.00, // No device
    food_subtotal: 250.00,
    total_amount: 250.00,
    payment_status: 'pending'
  })
  .select()
  .single();

// Insert food items only (no device slots)
await supabase.from('booking_food_items').insert([
  {
    booking_id: foodBooking.id,
    menu_item_id: 'burger-uuid',
    quantity: 1,
    unit_price: 150.00,
    line_total: 150.00,
    item_name: 'Burger',
    item_category: 'Meals'
  },
  {
    booking_id: foodBooking.id,
    menu_item_id: 'fries-uuid',
    quantity: 2,
    unit_price: 50.00,
    line_total: 100.00,
    item_name: 'Fries',
    item_category: 'Snacks'
  }
]);
```

---

## 5. Admin Batch Payment Collection

### Scenario: Customer has multiple bookings, admin collects payment together

**Customer has 3 bookings (initial, extension, food) - total ₹950**

```sql
-- Bookings to collect:
-- BP-20260530-001: ₹400 (2hr PS5)
-- BP-20260530-002: ₹200 (1hr extension)
-- BP-20260530-003: ₹250 (food order)
-- BP-20260530-004: ₹100 (more food)
```

```typescript
// Admin selects multiple bookings by customer phone
const unpaidBookings = await supabase
  .from('bookings')
  .select('*')
  .eq('customer_phone', '9876543210')
  .eq('payment_status', 'pending');

// Calculate total
const totalAmount = unpaidBookings.reduce(
  (sum, b) => sum + parseFloat(b.total_amount),
  0
); // ₹950

// Create payment group
const groupNumber = await supabase.rpc('generate_payment_group_number');
// Returns: PG-20260530-001

const { data: paymentGroup } = await supabase
  .from('payment_groups')
  .insert({
    group_number: groupNumber,
    total_amount: totalAmount,
    payment_method: 'cash', // or 'card', 'upi'
    payment_status: 'paid',
    collected_by_admin_id: CURRENT_ADMIN_ID,
    transaction_reference: 'CASH-001',
    paid_at: new Date()
  })
  .select()
  .single();

// Link all bookings to payment group
await supabase
  .from('bookings')
  .update({
    payment_group_id: paymentGroup.id,
    payment_status: 'paid'
  })
  .in('id', unpaidBookings.map(b => b.id));

// Done! All 4 bookings marked as paid in one transaction
```

### Admin UI Flow

1. **Search Customer**
   - Enter phone number or scan QR code
   - Shows all bookings for that customer

2. **Select Bookings**
   - Checkbox list of unpaid bookings
   - Shows: booking number, items, amount
   - Display total amount at bottom

3. **Collect Payment**
   - Click "Collect Payment"
   - Select payment method (Cash/Card/UPI/Online)
   - Enter transaction reference if needed
   - Click "Confirm Payment"

4. **Receipt**
   - Generate receipt with payment group number
   - Lists all included bookings
   - Print or SMS to customer

---

## 6. Database Slot Locking Mechanics

### How Lock Works

**Prevent Double Booking:**
```sql
-- UNIQUE constraint on booking_device_slots table
UNIQUE(device_id, slot_date, slot_start_time)
```

**Only Count Active Bookings:**
```sql
-- When checking availability, only consider:
WHERE b.status IN ('locked', 'confirmed', 'checked_in')
  AND (
    b.status != 'locked' OR 
    b.lock_expires_at > NOW() -- Expired locks don't count
  )
```

### Lock States

| Status | lock_expires_at | Blocks Slot? | Description |
|--------|-----------------|--------------|-------------|
| `draft` | NULL | No | Incomplete booking |
| `locked` | +10 minutes | Yes | Soft lock (payment pending) |
| `locked` | < NOW | No | Expired lock (auto-ignored) |
| `confirmed` | NULL | Yes | Paid and confirmed |
| `checked_in` | NULL | Yes | Customer arrived |
| `cancelled` | NULL | No | Cancelled booking |
| `expired` | NULL | No | Lock expired |

### Auto-Expire Locks

**Option 1: Periodic Cron Job**
```sql
-- Run every 1 minute
SELECT expire_locked_bookings(); -- Returns count of expired
```

**Option 2: Query-Time Handling**
```sql
-- Ignore expired locks at query time
WHERE b.status IN ('locked', 'confirmed', 'checked_in')
  AND (b.status != 'locked' OR b.lock_expires_at > NOW())
```

**Recommended:** Use query-time handling for simplicity.

---

## 7. Payment Method Scenarios

### Online Payment (Razorpay)

```typescript
// Create Razorpay order
const order = await razorpay.orders.create({
  amount: booking.total_amount * 100, // Paise
  currency: 'INR',
  receipt: booking.booking_number
});

// After successful payment
await supabase
  .from('bookings')
  .update({
    status: 'confirmed',
    payment_status: 'paid',
    lock_expires_at: null
  })
  .eq('id', booking.id);
```

### Offline Payment (Cash/Card/UPI at Counter)

```typescript
// Admin collects cash
const { data: paymentGroup } = await supabase
  .from('payment_groups')
  .insert({
    group_number: 'PG-20260530-001',
    total_amount: 950.00,
    payment_method: 'cash',
    payment_status: 'paid',
    collected_by_admin_id: adminId,
    transaction_reference: 'CASH-' + Date.now(),
    paid_at: new Date()
  })
  .select()
  .single();

// Mark bookings as paid
await supabase
  .from('bookings')
  .update({
    payment_group_id: paymentGroup.id,
    payment_status: 'paid'
  })
  .in('id', bookingIds);
```

---

## 8. QR Code Check-In Flow

### Generate QR Code (After Payment)

```typescript
// QR code data structure
const qrData = {
  bookingId: booking.id,
  bookingNumber: booking.booking_number,
  customerPhone: booking.customer_phone,
  deviceSlots: deviceSlots, // Array of slot details
  signature: generateSignature(booking.id) // HMAC for security
};

const qrCodeString = JSON.stringify(qrData);

// Store in booking
await supabase
  .from('bookings')
  .update({ qr_code_data: qrCodeString })
  .eq('id', booking.id);

// Generate QR code image for display
const qrCodeImage = await QRCode.toDataURL(qrCodeString);
```

### Admin Scans QR Code

```typescript
// Admin scans QR code
const scannedData = JSON.parse(qrCodeFromCamera);

// Verify signature
if (!verifySignature(scannedData)) {
  return { error: 'Invalid QR code' };
}

// Check in customer
const { data: booking } = await supabase
  .from('bookings')
  .update({
    status: 'checked_in',
    checked_in_at: new Date()
  })
  .eq('id', scannedData.bookingId)
  .select()
  .single();

// Update device status to occupied
await supabase
  .from('devices')
  .update({ status: 'occupied' })
  .in('id', booking.device_ids);
```

---

## 9. Subscription Discount Application

### Customer with Active Subscription

```typescript
// Check active subscription
const { data: subscription } = await supabase
  .from('subscription_purchases')
  .select('*')
  .eq('customer_phone', '9876543210')
  .eq('is_active', true)
  .gte('expires_at', new Date())
  .single();

if (subscription) {
  // Apply discounts
  const deviceDiscount = deviceSubtotal * (subscription.device_discount_percentage / 100);
  const foodDiscount = foodSubtotal * (subscription.food_discount_percentage / 100);
  const totalDiscount = deviceDiscount + foodDiscount;

  // Create booking with discount
  await supabase.from('bookings').insert({
    // ...
    device_subtotal: deviceSubtotal,
    food_subtotal: foodSubtotal,
    subscription_discount: totalDiscount,
    total_amount: deviceSubtotal + foodSubtotal - totalDiscount
  });
}
```

---

## 10. Admin Dashboard Queries

### Today's Bookings

```sql
SELECT 
  b.booking_number,
  b.customer_name,
  b.customer_phone,
  b.status,
  b.payment_status,
  b.total_amount,
  COUNT(bds.id) as device_slot_count,
  COUNT(bfi.id) as food_item_count
FROM bookings b
LEFT JOIN booking_device_slots bds ON bds.booking_id = b.id
LEFT JOIN booking_food_items bfi ON bfi.booking_id = b.id
WHERE DATE(b.created_at) = CURRENT_DATE
GROUP BY b.id
ORDER BY b.created_at DESC;
```

### Revenue by Payment Method (Today)

```sql
SELECT 
  pg.payment_method,
  COUNT(DISTINCT pg.id) as transaction_count,
  SUM(pg.total_amount) as total_revenue
FROM payment_groups pg
WHERE DATE(pg.paid_at) = CURRENT_DATE
  AND pg.payment_status = 'paid'
GROUP BY pg.payment_method;
```

### Unpaid Bookings

```sql
SELECT 
  b.booking_number,
  b.customer_name,
  b.customer_phone,
  b.total_amount,
  b.created_at
FROM bookings b
WHERE b.payment_status IN ('pending', 'partial')
  AND b.status IN ('confirmed', 'checked_in', 'completed')
ORDER BY b.created_at;
```

---

## Summary

This redesigned system provides:

✅ **Flexibility**: Book device, food, or both in one booking  
✅ **Scalability**: Create multiple bookings per customer  
✅ **Admin Control**: Collect payment for multiple bookings together  
✅ **Simplicity**: No Redis, all locking in PostgreSQL  
✅ **Reliability**: UNIQUE constraints prevent double-booking  
✅ **Auditability**: Payment groups track who collected what when  

See `SCHEMA_DESIGN.md` for complete database structure.
