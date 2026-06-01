# Schema Fixes Summary

## Issues Fixed

### 1. Removed Device Quantity ✅

**Problem**: Devices table had a quantity field that wasn't needed (each device is a unique station)

**Files Modified**:
- `app/(customer)/booking/actions.ts` - Removed quantity from SELECT query
- `app/(customer)/booking/page.tsx` - Removed quantity display from availability badge
- `app/(admin)/admin/devices/page.tsx` - Changed counting logic from sum of quantities to simple count
- `app/(admin)/admin/devices/actions.ts` - Removed quantity from createDevice() and updateDevice()
- `components/admin/devices/AddDeviceModal.tsx` - Removed quantity field and state
- `components/admin/devices/EditDeviceModal.tsx` - Removed quantity field and state

**Result**: Each device record now represents a single physical station

---

### 2. Added Menu Items Quantity ✅

**Problem**: Menu items (food/drinks) need quantity tracking for inventory management

**Migration Created**: `20260530094500_add_quantity_to_menu_items.sql`

```sql
ALTER TABLE public.menu_items
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0);

CREATE INDEX idx_menu_items_low_stock ON public.menu_items(quantity)
WHERE quantity < 10;

UPDATE public.menu_items
SET quantity = 50
WHERE quantity = 0;
```

**Files Already Supporting Quantity**:
- `app/(admin)/admin/food/page.tsx` - Displays total quantity
- `app/(admin)/admin/food/actions.ts` - Handles quantity in create/update
- Admin food components already have quantity fields

**Result**: Food items now have proper inventory tracking

---

### 3. Fixed Booking Schema References ✅

**Problem**: Booking actions were using old schema fields (`slot_lock_expiry`, `soft_locked`)

**Files Modified**:
- `app/(customer)/booking/actions.ts`:
  - Updated `DatabaseBookingRow` interface
  - Fixed `fetchLiveActiveBookings()` to use `booking_device_slots` table
  - Fixed `initializeSoftLockReservation()` to check availability from new schema
  - Changed from `slot_lock_expiry` → `lock_expires_at`
  - Changed from `soft_locked` → `locked` status
  - Now queries `booking_device_slots` table directly for slot availability

**New Schema Fields Used**:
- `bookings.lock_expires_at` (TIMESTAMPTZ)
- `bookings.status` IN ('locked', 'confirmed', 'checked_in')
- `booking_device_slots` table for slot occupancy

**Result**: Booking flow now works with redesigned schema

---

### 4. Fixed QRCode Import ✅

**Problem**: React error about invalid component type for QRCode

**Files Modified**:
- `app/(customer)/booking/auth/page.tsx`
- `app/(customer)/my-bookings/page.tsx`

**Changed**:
```typescript
// Before (v3.x syntax)
import QRCode from "qrcode.react";
<QRCode value={bookingNumber} />

// After (v4.x syntax)
import { QRCodeSVG } from "qrcode.react";
<QRCodeSVG value={bookingNumber} />
```

**Result**: QR codes now render correctly

---

## Current Schema State

### Devices Table
- ❌ No quantity field
- ✅ Each record = one physical station
- Fields: id, type, station_number, hourly_rate, status, specs, image_url

### Menu Items Table
- ✅ Has quantity field (inventory tracking)
- Fields: id, name, category, price, status, description, image_url, **quantity**

### Bookings Table
- ✅ Uses lock_expires_at (not slot_lock_expiry)
- ✅ Uses 'locked' status (not 'soft_locked')
- ✅ Linked to booking_device_slots table

### Booking Device Slots Table
- ✅ Stores actual slot reservations
- ✅ Used for availability checking
- ✅ Has UNIQUE constraint on (device_id, slot_date, slot_start_time)

---

## Migration Order

All migrations applied successfully:

1. `20260520103547_create_devices_table.sql` - Original devices table
2. `20260523054902_create_menu_items_table.sql` - Original menu items
3. `20260530092146_redesigned_schema.sql` - Complete schema redesign
4. `20260530093229_add_customers_table.sql` - Customers table
5. `20260530094500_add_quantity_to_menu_items.sql` - **NEW: Add quantity to food**

---

## Testing Checklist

### Devices (No Quantity)
- ✅ Can add device without quantity field
- ✅ Can edit device without quantity field
- ✅ Device count shows total number of devices (not sum of quantities)
- ✅ Availability badge shows "AVAILABLE" (no quantity number)

### Menu Items (With Quantity)
- ✅ Can add food item with quantity
- ✅ Can edit food item quantity
- ✅ Quantity displayed in admin food management
- ✅ Low stock index works for quantity < 10

### Booking Flow
- ✅ Slot availability checks work
- ✅ No errors about slot_lock_expiry
- ✅ Bookings use lock_expires_at field
- ✅ Status transitions work (locked → confirmed)

### QR Codes
- ✅ QR codes display on success page
- ✅ QR codes display in my-bookings modal
- ✅ No React component errors

---

## Summary

**Devices**: Quantity removed (not needed)  
**Food**: Quantity added (inventory tracking)  
**Bookings**: Updated to use redesigned schema  
**QR Codes**: Fixed import for v4.x

All issues resolved and database migrations applied successfully!

---

**Status**: ✅ All Fixed  
**Last Updated**: May 30, 2026
