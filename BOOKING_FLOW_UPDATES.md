# Customer Booking Flow - Updates

## Overview

Updated the customer booking flow to skip OTP verification and integrate with the new customers table. Payment integration is temporarily mocked for testing.

## Changes Made

### 1. Updated Auth/Checkout Page (`app/(customer)/booking/auth/page.tsx`)

**New Multi-Step Flow:**

#### Step 1: Phone Number Entry
- Customer enters phone number
- System checks if customer exists in database
- No OTP sent (skipped as requested)

#### Step 2A: Existing Customer
- If phone exists, welcome message shown
- Customer name and email retrieved from database
- Skips to summary page

#### Step 2B: New Customer
- If phone doesn't exist, asks for:
  - Full Name (required)
  - Email Address (optional)
- Data validated and saved

#### Step 3: Booking Summary
- Shows complete booking details:
  - Customer information (name, phone, email)
  - Device and slot details
  - Price breakdown with add-ons
- "Confirm Booking" button to finalize

#### Step 4: Success Page
- Confirmation message
- Booking details summary
- Options to:
  - Book another slot
  - Return to home

### 2. New Server Actions (`app/(customer)/booking/actions.ts`)

#### `checkCustomerExists(phone: string)`
**Purpose:** Check if customer exists by phone number

**Returns:**
```typescript
{
  success: boolean;
  exists: boolean;
  customer: { id, name, phone, email } | null;
}
```

**Usage:**
```typescript
const result = await checkCustomerExists('9876543210');
if (result.exists) {
  // Existing customer
  console.log(result.customer.name);
} else {
  // New customer - ask for details
}
```

#### `confirmBooking(payload)`
**Purpose:** Create complete booking with customer and slot

**Steps:**
1. Get or create customer using `get_or_create_customer()`
2. Generate booking number
3. Create booking record (status: 'confirmed', payment: 'paid')
4. Create device slot reservation
5. Create add-on items (if any)

**Payload:**
```typescript
{
  phone: string;
  name: string;
  email: string;
  deviceId: string;
  deviceName: string;
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;
  hourlyRate: number;
  addons: AddonSelection[];
  subtotal: number;
  total: number;
}
```

**Returns:**
```typescript
{
  success: boolean;
  bookingId?: string;
  error?: string;
}
```

### 3. Integration with Customers Table

**Database Flow:**
```sql
-- 1. Get or create customer
SELECT get_or_create_customer('9876543210', 'John Doe', 'john@example.com');
-- Returns: customer_id

-- 2. Generate booking number
SELECT generate_booking_number();
-- Returns: BP-20260530-001

-- 3. Create booking
INSERT INTO bookings (
  booking_number,
  customer_id,
  customer_phone,
  customer_name,
  status,
  payment_status,
  ...
) VALUES (...);

-- 4. Create device slot
INSERT INTO booking_device_slots (
  booking_id,
  device_id,
  slot_date,
  slot_start_time,
  ...
) VALUES (...);

-- 5. Create add-ons (if any)
INSERT INTO booking_food_items (
  booking_id,
  item_name,
  quantity,
  ...
) VALUES (...);
```

### 4. UI/UX Improvements

**Progress Indicator:**
- Visual steps: Phone → Details → Confirm
- Green checkmarks for completed steps
- Yellow highlight for current step

**Customer Experience:**
- **Returning customers:** 2-click booking (phone → confirm)
- **New customers:** 3-click booking (phone → details → confirm)
- No wait for OTP (faster flow)
- Clear summary before confirmation

**Mobile Responsive:**
- Optimized for mobile devices
- Touch-friendly buttons
- Smooth animations

### 5. Payment Integration (Mocked)

**Current Behavior:**
- No Razorpay integration
- Bookings automatically marked as:
  - `status: 'confirmed'`
  - `payment_status: 'paid'`
- Success message shown immediately

**To Enable Real Payments (Future):**
1. Add Razorpay order creation before confirmation
2. Show Razorpay checkout modal
3. Wait for payment callback
4. Update booking status on success
5. Handle payment failures

**Code Location for Razorpay Integration:**
```typescript
// In confirmBooking() action, before creating booking:

// Create Razorpay order
const razorpayOrder = await razorpay.orders.create({
  amount: payload.total * 100, // Paise
  currency: 'INR',
  receipt: bookingNumber
});

// Return order ID to client
// Client shows Razorpay checkout
// On success callback, update booking status
```

---

## Testing the Flow

### Test Case 1: New Customer Booking

1. Navigate to `/booking`
2. Select a device (e.g., PS5-001)
3. Choose time slot
4. Enter phone: `9999999999`
5. See "New Customer" form
6. Enter name: "Test User"
7. Enter email: "test@example.com" (optional)
8. Review summary
9. Click "Confirm Booking"
10. See success page

**Expected Database State:**
```sql
-- New customer created
SELECT * FROM customers WHERE phone = '9999999999';
-- Returns: { id, name: "Test User", phone, email }

-- New booking created
SELECT * FROM bookings WHERE customer_phone = '9999999999';
-- Returns: { booking_number: BP-..., status: 'confirmed', payment_status: 'paid' }

-- Device slot reserved
SELECT * FROM booking_device_slots WHERE booking_id = ...;
-- Returns: { device_id, slot_date, slot_start_time, ... }
```

### Test Case 2: Returning Customer Booking

1. Navigate to `/booking`
2. Select a device
3. Choose time slot
4. Enter phone: `9999999999` (from Test Case 1)
5. See "Welcome back, Test User!" message
6. Skips to summary (name/email pre-filled)
7. Click "Confirm Booking"
8. See success page

**Expected Database State:**
```sql
-- Customer already exists (not duplicated)
SELECT COUNT(*) FROM customers WHERE phone = '9999999999';
-- Returns: 1

-- New booking created for same customer
SELECT * FROM bookings WHERE customer_phone = '9999999999';
-- Returns: 2 rows (original + new)
```

### Test Case 3: Booking with Add-ons

1. Select device with add-ons (e.g., Extra Player)
2. Complete booking flow
3. Check database

**Expected Database State:**
```sql
-- Add-ons saved as food items
SELECT * FROM booking_food_items WHERE booking_id = ...;
-- Returns: { item_name: "EXTRA PLAYER", quantity: 2, category: "Add-ons" }
```

---

## API Endpoints Used

### Supabase RPCs
- `get_or_create_customer(phone, name, email)` - Get or create customer
- `generate_booking_number()` - Generate BP-YYYYMMDD-XXX

### Supabase Tables
- `customers` - Customer profiles
- `bookings` - Main booking records
- `booking_device_slots` - Device slot reservations
- `booking_food_items` - Add-ons and food orders

---

## Redux State Flow

**Booking State Structure:**
```typescript
{
  // Device
  deviceId: string;
  deviceName: string;
  hourlyRate: number;

  // Slot
  selectedDate: string;
  selectedSlot: string;
  slotStartTime: string;
  slotEndTime: string;

  // Add-ons
  addons: Array<{ id, name, price, quantity }>;

  // Pricing
  subtotal: number;
  total: number;

  // Customer (new)
  phone: string;
  name: string;
  email: string;
}
```

**State Updates:**
1. Device page: `setDevice()`
2. Slot page: `setSlot()`, `setPricing()`
3. Auth page: `setCustomerDetails()`
4. Success page: `resetBooking()`

---

## Next Steps

### Immediate
- [x] Phone number entry
- [x] Customer check
- [x] Name/email collection for new customers
- [x] Booking summary
- [x] Confirmation (mocked payment)
- [x] Success page
- [x] Integration with customers table

### Future Enhancements
- [ ] Add Razorpay integration
- [ ] Email/SMS confirmation
- [ ] QR code generation
- [ ] Booking history page
- [ ] Edit/cancel booking
- [ ] Subscription discount application
- [ ] Promo code validation

---

## File Changes Summary

**Modified Files:**
1. `app/(customer)/booking/auth/page.tsx` - Complete rewrite with multi-step flow
2. `app/(customer)/booking/actions.ts` - Added `checkCustomerExists()` and `confirmBooking()`

**Database Dependencies:**
- `customers` table (from migration 20260530093229)
- `get_or_create_customer()` function
- `generate_booking_number()` function
- `bookings`, `booking_device_slots`, `booking_food_items` tables

**Redux Dependencies:**
- `setCustomerDetails()` action
- `resetBooking()` action

---

## Notes

### Why Skip OTP?
- Faster booking flow for testing
- Reduces friction during development
- Easy to add back later (just uncomment OTP code)

### Why Mock Payment?
- Focus on booking flow first
- Razorpay requires test credentials
- Easy to integrate when ready (see code comments)

### Customer Data
- Phone is primary identifier (unique)
- Name is required
- Email is optional
- Customer record reused across bookings

### Booking Status
- `status: 'confirmed'` - Booking is active
- `payment_status: 'paid'` - Payment received (mocked)
- Can later add `pending` status when Razorpay integrated

---

## Screenshots (Flow)

```
┌─────────────────┐
│  Select Device  │
│   (PS5-001)     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Choose Slot    │
│  (14:00-15:00)  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Enter Phone    │
│  9876543210     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    v         v
┌────────┐ ┌──────────┐
│Existing│ │   New    │
│Customer│ │Customer  │
└───┬────┘ └────┬─────┘
    │           │
    │           v
    │      ┌──────────┐
    │      │Name/Email│
    │      └────┬─────┘
    │           │
    └─────┬─────┘
          │
          v
    ┌──────────┐
    │ Summary  │
    │ Review   │
    └────┬─────┘
         │
         v
    ┌──────────┐
    │ Success! │
    │   🎉     │
    └──────────┘
```

---

**Status:** ✅ Implemented and tested
**Last Updated:** May 30, 2026
