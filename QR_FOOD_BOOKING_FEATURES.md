# QR Code, Food Ordering & Booking Retrieval Features

## Overview

Added complete booking confirmation flow with QR code generation, booking retrieval system, and in-booking food ordering capability.

---

## 1. QR Code Generation (Success Page)

### Location
`app/(customer)/booking/auth/page.tsx` - Success step

### Features
- **QR Code Display**: Shows scannable QR code with booking number
- **Booking Number**: Large, prominent display of booking number (e.g., BP-20260530-001)
- **Booking Summary**: Complete details including customer name, device, date/time, amount paid
- **Action Buttons**:
  - Order Food & Drinks → Navigate to food ordering
  - Book Another Slot → Reset and start new booking
  - View My Bookings → Go to bookings retrieval page
  - Back to Home → Return to homepage

### Implementation
```typescript
<QRCode value={bookingNumber} size={160} level="H" />
```

### Data Flow
1. `confirmBooking()` returns `{ success, bookingId, bookingNumber }`
2. Success page stores both values in state
3. QR code generated from booking number
4. Booking ID used for food ordering navigation

---

## 2. Booking Retrieval Page

### Location
`app/(customer)/my-bookings/page.tsx`

### Features

#### Search by Phone
- Enter 10-digit mobile number
- Search button or press Enter to search
- URL parameter support: `/my-bookings?phone=9876543210`

#### Bookings List View
- Shows all bookings for the phone number
- Sorted by creation date (newest first)
- Each card displays:
  - Booking number (yellow, monospace)
  - Status badge (confirmed/completed/cancelled)
  - Date, time, and amount
  - "View Details" button

#### Booking Details Modal
When clicking on a booking:
- **QR Code**: Scannable booking QR code
- **Customer Information**: Name and phone
- **Device Slots**: All booked devices with date/time
- **Food & Add-ons**: List of food items ordered (if any)
- **Payment Info**: Status and total amount
- **Action Button**: "Order Food & Drinks" (if booking is confirmed)

### Database Query
```sql
SELECT 
  bookings.*,
  booking_device_slots.*,
  booking_food_items.*
FROM bookings
WHERE customer_phone = ?
ORDER BY created_at DESC
```

### Server Action
`app/(customer)/my-bookings/actions.ts`
- `getCustomerBookings(phone)` - Fetches all bookings with related data

---

## 3. Food Ordering Page

### Location
`app/(customer)/booking/[bookingId]/food/page.tsx`

### Features

#### Menu Display
- **Category Filters**: All, Snacks, Drinks, Meals
- **Grid Layout**: Responsive 1-3 column grid
- **Item Cards**:
  - Image (if available)
  - Name and description
  - Category badge (color-coded)
  - Price in ₹
  - Add/Quantity controls
  - "Out of Stock" indicator for unavailable items

#### Shopping Cart
- **Add to Cart**: Click "Add" button or "+" to increase quantity
- **Remove from Cart**: Click "-" to decrease or remove
- **Fixed Bottom Bar**:
  - Cart item count badge
  - Total amount display
  - "Clear Cart" button
  - "Place Order" button

#### Order Submission
1. Add items to cart
2. Review total in bottom bar
3. Click "Place Order"
4. Items added to `booking_food_items` table
5. Booking's `food_subtotal` and `total_amount` updated
6. Redirect to "My Bookings" page

### Server Actions
`app/(customer)/booking/[bookingId]/food/actions.ts`
- `getMenuItems()` - Fetch all menu items
- `addFoodToBooking(bookingId, foodItems)` - Add food order to booking

### Database Updates
```sql
-- Insert food items
INSERT INTO booking_food_items (
  booking_id, menu_item_id, item_name, item_category,
  quantity, unit_price, line_total, status
) VALUES (...);

-- Update booking totals
UPDATE bookings
SET 
  food_subtotal = food_subtotal + ?,
  total_amount = device_subtotal + food_subtotal
WHERE id = ?;
```

---

## 4. Navigation Flow

### From Success Page (After Booking)
```
Booking Success
├── Order Food & Drinks → /booking/{id}/food
├── Book Another Slot → /booking (reset state)
├── View My Bookings → /my-bookings?phone={phone}
└── Back to Home → /
```

### From My Bookings Page
```
My Bookings
├── Search by phone
├── View booking details (modal)
│   ├── See QR code
│   ├── Order Food & Drinks → /booking/{id}/food
│   └── Close modal
└── Back to Home → /
```

### From Food Ordering Page
```
Food Ordering
├── Add items to cart
├── Place Order → /my-bookings?phone={phone}
└── (Cancel - browser back)
```

---

## 5. Updated Files

### Modified Files
1. **app/(customer)/booking/auth/page.tsx**
   - Added QR code generation on success page
   - Added booking number and ID state
   - Added navigation buttons (food order, view bookings)
   - Imported `QRCode` component

2. **app/(customer)/booking/actions.ts**
   - Updated `confirmBooking()` to return `bookingNumber`

### New Files
1. **app/(customer)/my-bookings/page.tsx**
   - Customer booking retrieval page
   - Phone search functionality
   - Bookings list view
   - Booking details modal with QR code

2. **app/(customer)/my-bookings/actions.ts**
   - `getCustomerBookings(phone)` - Fetch customer bookings

3. **app/(customer)/booking/[bookingId]/food/page.tsx**
   - Food ordering interface
   - Menu items grid with categories
   - Shopping cart functionality
   - Order submission

4. **app/(customer)/booking/[bookingId]/food/actions.ts**
   - `getMenuItems()` - Fetch menu
   - `addFoodToBooking()` - Add food to existing booking

---

## 6. Key Features

### QR Code
- **Library**: `qrcode.react`
- **Size**: 160x160 pixels
- **Error Correction**: High (Level H)
- **Content**: Booking number (e.g., BP-20260530-001)
- **Usage**: Show at counter to start session

### Booking Retrieval
- **Search**: By phone number
- **Auto-load**: URL parameter support
- **History**: All bookings (confirmed/completed/cancelled)
- **Details**: Full booking information in modal
- **Actions**: Re-order food from confirmed bookings

### Food Ordering
- **Add to Booking**: Attach food orders to existing bookings
- **Total Update**: Automatically recalculates booking total
- **Status**: Food items marked as "pending"
- **Payment**: Added to booking's total amount
- **Flexibility**: Order food anytime for confirmed bookings

---

## 7. User Experience Flow

### Happy Path: Complete Booking with Food
1. Customer selects device and time slot
2. Enters phone number
3. Provides name/email (if new customer)
4. Reviews summary and confirms
5. **Success page shows**:
   - QR code for check-in
   - Booking number
   - Complete booking details
6. **Customer clicks "Order Food"**:
   - Browses menu by category
   - Adds items to cart
   - Places food order
7. **Redirected to "My Bookings"**:
   - Can see updated booking with food items
   - Can order more food later
   - Can view QR code again

### Returning Customer Flow
1. Visit `/my-bookings`
2. Enter phone number
3. See all bookings
4. Click on a booking to:
   - View QR code
   - See all details
   - Order additional food (if confirmed)

---

## 8. Database Schema Integration

### Tables Used

#### bookings
- Stores main booking record
- Updated fields: `food_subtotal`, `total_amount`

#### booking_device_slots
- Linked to booking via `booking_id`
- Retrieved for display in booking details

#### booking_food_items
- Stores food orders per booking
- Fields: `menu_item_id`, `item_name`, `quantity`, `unit_price`, `line_total`, `status`

#### menu_items
- Source of food items
- Filtered by `status = 'available'`

---

## 9. Mobile Responsive

All pages are fully mobile-responsive:
- QR codes scale appropriately
- Booking cards stack vertically on mobile
- Food menu grid adapts to screen size
- Fixed bottom cart bar on mobile
- Modal dialogs fit mobile screens

---

## 10. Future Enhancements

### Potential Additions
- [ ] Download QR code as image
- [ ] Share booking details via WhatsApp
- [ ] Email/SMS booking confirmation with QR code
- [ ] Real-time food order status tracking
- [ ] Push notifications for order ready
- [ ] Payment integration for food orders
- [ ] Booking cancellation/modification
- [ ] Subscription discount application
- [ ] Loyalty points system

---

## Testing Checklist

### QR Code
- ✅ QR code displays correctly
- ✅ Contains booking number
- ✅ Scannable by standard QR readers

### Booking Retrieval
- ✅ Search by phone returns correct bookings
- ✅ Bookings sorted by date (newest first)
- ✅ Modal shows complete booking details
- ✅ QR code visible in modal
- ✅ Food items displayed if present

### Food Ordering
- ✅ Menu items load correctly
- ✅ Category filters work
- ✅ Add/remove items from cart
- ✅ Cart total calculates correctly
- ✅ Order submission works
- ✅ Booking total updates
- ✅ Food items saved to database

### Navigation
- ✅ All buttons navigate correctly
- ✅ URL parameters work
- ✅ Back buttons function properly

---

**Status**: ✅ Fully Implemented  
**Last Updated**: May 30, 2026
