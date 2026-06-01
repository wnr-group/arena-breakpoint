# Breakpoint Arena - Complete Project Context

> Last Updated: 2026-05-31

## 📋 Project Overview

**Breakpoint Arena** is a gaming station booking system with separate interfaces for customers and administrators. The system manages device bookings (gaming stations, snooker tables, PS5 consoles), food orders, and customer management.

### Business Model
- Hourly device rentals (snooker tables, pool tables, PS5 consoles)
- Food and beverage sales
- Add-on peripherals (extra controllers, etc.)
- Multiple pricing tiers based on device types

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.1.3 (App Router)
- **React**: 19.0.0
- **Styling**: Tailwind CSS v4.3.0
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Redux Toolkit 2.2.1
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **QR Codes**: qrcode.react v4.1.0

### Backend
- **Runtime**: Node.js 26.0.0
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase Client (supabase-js 2.39.0)
- **API**: Next.js Server Actions
- **Authentication**: Phone-based (no auth system yet)

### DevOps & Tools
- **Package Manager**: pnpm
- **Linting**: ESLint 9.0.0
- **Formatting**: Prettier 3.2.5
- **Git Hooks**: Husky + lint-staged
- **TypeScript**: 5.3.3

---

## 🎨 Design System

### Theme Colors (Dynamic)
Primary color can be changed globally in `app/globals.css`:

```css
--primary: #FFC107;        /* Golden (current) */
--primary-hover: #ffcd38;  /* Lighter golden */
--primary-dark: #e6ad06;   /* Darker golden */
```

Change these to update the entire app theme (e.g., purple, blue). See `THEMING.md` for details.

### Color Palette
- **Primary**: Golden (#FFC107) - Used for CTAs, highlights, active states
- **Background**: Black (#0a0a0a)
- **Cards**: Dark gray (#121212, #111)
- **Borders**: Zinc-800/900 (#27272a)
- **Text**: White (primary), Zinc-400/500 (secondary)
- **Success**: Green-500
- **Error**: Red-500
- **Warning**: Amber-500

### Typography
- **Font**: System fonts (Arial, Helvetica, sans-serif)
- **Style**: UPPERCASE for headers, bold weights, tight tracking
- **Sizes**: Very small (10px-11px) for metadata, 12-14px for body

---

## 📁 Project Structure

```
breakpoint-arena/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── devices/              # Device management
│   │       │   ├── page.tsx          # Main devices page
│   │       │   └── actions.ts        # Server actions for devices
│   │       └── food/                 # Food menu management
│   │           ├── page.tsx
│   │           └── actions.ts
│   ├── (customer)/
│   │   ├── booking/                  # New booking flow
│   │   │   ├── page.tsx              # Device selection
│   │   │   ├── auth/page.tsx         # Customer details + payment
│   │   │   ├── [bookingId]/page.tsx  # Booking confirmation
│   │   │   └── actions.ts            # Booking server actions
│   │   ├── retrieve/                 # Retrieve existing bookings
│   │   │   └── page.tsx
│   │   └── my-bookings/              # (Not implemented yet)
│   ├── globals.css                   # Global styles + theme variables
│   └── layout.tsx                    # Root layout
├── components/
│   ├── admin/
│   │   ├── devices/
│   │   │   ├── AddDeviceModal.tsx
│   │   │   ├── EditDeviceModal.tsx
│   │   │   ├── DeviceFilters.tsx
│   │   │   ├── DeviceGrid.tsx
│   │   │   └── DeviceTable.tsx
│   │   └── food/
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── redux/
│   │   ├── slices/
│   │   │   └── bookingSlice.ts       # Booking state management
│   │   ├── hooks.ts
│   │   └── store.ts
│   └── supabase/
│       └── server.ts                 # Supabase admin client
├── supabase/
│   ├── migrations/
│   │   ├── 20260530092146_redesigned_schema.sql
│   │   ├── 20260530093229_add_customers_table.sql
│   │   ├── 20260530094500_add_quantity_to_menu_items.sql
│   │   └── 20260530095000_create_device_types_table.sql
│   ├── seed.sql                      # Sample data
│   └── config.toml                   # Supabase config
├── THEMING.md                        # Theme customization guide
├── PROJECT_CONTEXT.md                # This file
├── SCHEMA_DESIGN.md                  # Database schema documentation
└── package.json
```

---

## 🗄️ Database Schema

### Core Tables

#### `customers`
Stores customer information (phone-based identification).

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `device_types`
Defines device categories with pricing and player limits.

```sql
CREATE TABLE device_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,              -- e.g., 'ps5', 'standard_snooker'
  display_name TEXT NOT NULL,              -- e.g., 'PS5 Console'
  regular_hourly_rate NUMERIC(10,2) NOT NULL,
  included_players INTEGER DEFAULT 1 NOT NULL,
  max_players INTEGER NOT NULL,
  extra_player_charge NUMERIC(10,2) DEFAULT 0 NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Pre-populated Device Types:**
1. Standard Snooker Table - ₹379/hr (4 players inc., max 8, +₹79/extra)
2. Medium Snooker Table - ₹299/hr (4 players inc., max 8, +₹79/extra)
3. American Pool Table - ₹249/hr (4 players inc., max 8, +₹49/extra)
4. PS5 Console - ₹200/hr (1 player inc., max 4, +₹150/extra)
5. Other Gaming Device - ₹200/hr (1 player inc., max 4, +₹100/extra)

#### `devices`
Individual gaming stations/devices.

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID REFERENCES device_types(id) NOT NULL,
  station_number TEXT UNIQUE NOT NULL,    -- e.g., 'STN-001', 'PS5-01'
  status TEXT DEFAULT 'available',         -- available, maintenance, inactive
  specs TEXT,                              -- Hardware specifications
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `bookings`
Main booking records.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,     -- BKG-XXXXXX (6 digits)
  customer_id UUID REFERENCES customers(id),
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  
  device_subtotal NUMERIC(10,2) DEFAULT 0,
  food_subtotal NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  status TEXT DEFAULT 'locked',            -- locked, confirmed, checked_in, completed, cancelled
  payment_status TEXT DEFAULT 'pending',   -- pending, paid, refunded
  locked_by TEXT,                          -- 'customer', 'admin', 'walk-in'
  lock_expires_at TIMESTAMPTZ,             -- For temporary locks (10 min)
  
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `booking_device_slots`
Device time slots for each booking.

```sql
CREATE TABLE booking_device_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) NOT NULL,
  
  slot_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_end_time TIME NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL,
  
  hourly_rate NUMERIC(10,2) NOT NULL,
  slot_total NUMERIC(10,2) NOT NULL,
  
  device_type TEXT,                        -- Snapshot for reports
  device_station_number TEXT,              -- Snapshot for reports
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `menu_items`
Food and beverage menu.

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,                  -- Beverages, Snacks, Meals, Add-ons
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER DEFAULT 50,             -- Inventory tracking
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `booking_food_items`
Food orders associated with bookings.

```sql
CREATE TABLE booking_food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id),  -- NULL for add-ons
  
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  
  item_name TEXT NOT NULL,                 -- Snapshot for history
  item_category TEXT NOT NULL,
  status TEXT DEFAULT 'pending',           -- pending, preparing, served
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Database Functions

#### `generate_booking_number()`
Generates unique booking numbers (BKG-000001 format).

#### `get_or_create_customer(p_phone, p_name, p_email)`
Returns customer ID, creating a new customer if needed.

---

## 🔄 Key Workflows

### Customer Booking Flow

1. **Device Selection** (`/booking`)
   - Browse available devices (filtered by type)
   - View pricing and specs
   - Select device
   - Add peripherals/add-ons
   - Continue to slot selection

2. **Time Slot Selection** (`/booking/slots`)
   - Pick date
   - Select available time slot
   - View real-time availability
   - Continue to checkout

3. **Customer Details + Payment** (`/booking/auth`)
   - Enter phone number
   - Auto-fill if returning customer
   - Enter name and email
   - Review booking summary
   - Mock payment (Razorpay integration pending)
   - Create booking

4. **Confirmation** (`/booking/[bookingId]`)
   - Show booking number with QR code
   - Display device slot details
   - Show customer info
   - Payment receipt

### Booking Retrieval Flow

**Phone Lookup** (`/retrieve`)
- Customer enters phone number
- View all bookings for that phone
- Display QR codes for each booking
- Show device slots and food items

### Admin Device Management

**Device CRUD** (`/admin/devices`)
- List all devices (grid/table view)
- Filter by device type
- Add new device (select device type)
- Edit device details
- Delete device
- View pricing from device_types

**Device Type Management**
- Device types are pre-configured in database
- Pricing managed centrally
- Each device references a device_type

---

## 🎯 Key Features

### Implemented ✅

- **Customer Booking System**
  - Device selection with live availability
  - Add-on selection (extra controllers, etc.)
  - Time slot booking with conflict detection
  - Phone-based customer identification
  - QR code generation for bookings
  - Booking retrieval by phone

- **Admin Device Management**
  - Device CRUD operations
  - Device type filtering
  - Grid and table views
  - Image uploads
  - Status management (available, maintenance, inactive)

- **Admin Food Management**
  - Menu item CRUD
  - Category management
  - Inventory tracking (quantity)
  - Price management

- **Device Types System**
  - Centralized pricing configuration
  - Player limits and extra charges
  - Multiple device categories
  - Easy pricing updates

- **Theming System**
  - Dynamic primary color
  - Global CSS variables
  - Easy theme switching

### Pending ⏳

- **Payment Integration**
  - Razorpay gateway integration (currently mocked)
  - Payment status tracking
  - Refund handling

- **Subscription Plans**
  - Monthly/yearly subscriptions
  - Member discounts
  - Plan management

- **Booking Status Management**
  - Check-in functionality
  - Check-out with duration calculation
  - Overtime charges

- **Admin Dashboard**
  - Revenue analytics
  - Device utilization stats
  - Popular items tracking

- **Customer Account System**
  - Phone OTP authentication
  - Booking history
  - Favorite devices
  - Saved payment methods

- **Food Ordering During Booking**
  - Order food while gaming
  - Real-time order status
  - Kitchen integration

---

## 🔧 Important Patterns & Conventions

### Server Actions
All data mutations use Next.js Server Actions with consistent return format:

```typescript
return {
  success: boolean,
  data?: any,
  error?: string
};
```

### Redux State Management
Booking flow uses Redux for temporary state:

```typescript
interface BookingState {
  device: { id, name, type, hourlyRate } | null;
  addons: Array<{ id, name, price, quantity }>;
  date: string | null;
  slot: { label, start, end } | null;
  pricing: { subtotal, subscriptionDiscount, promoDiscount, total };
}
```

### Time Format Conversions
- **Display**: "10:00 AM - 11:00 AM" (12-hour)
- **Database**: "10:00:00" (24-hour TIME type)
- Conversion functions in `actions.ts` files

### QR Code Implementation
```tsx
import { QRCodeSVG } from "qrcode.react";

<QRCodeSVG 
  value={bookingNumber} 
  size={160} 
  level="H"
  includeMargin={true}
/>
```

### Device Status Logic
- `available` - Can be booked by customers
- `maintenance` - Hidden from customer view
- `inactive` - Soft deleted, hidden from all views

### Booking Lock System
- Temporary locks expire after 10 minutes
- Lock status checked before confirming bookings
- Expired locks treated as available slots

---

## 📝 Recent Major Changes

### 1. Device Types Migration (2026-05-30)
- Created `device_types` table with 5 pre-configured types
- Migrated devices to reference device_types
- Removed `type` and `hourly_rate` from devices table
- Updated all admin and customer UIs

### 2. Schema Redesign (2026-05-30)
- Renamed `slot_lock_expiry` → `lock_expires_at`
- Changed `soft_locked` status → `locked`
- Separated device slots and food items into junction tables
- Added `customers` table for customer management

### 3. Quantity Field Updates (2026-05-30)
- Removed quantity from devices (each device is unique)
- Added quantity to menu_items (for inventory tracking)

### 4. QR Code Fix (2026-05-30)
- Fixed import for qrcode.react v4.x
- Changed from default export to named export `QRCodeSVG`

### 5. Theming System (2026-05-31)
- Implemented CSS variable-based theming
- Created dynamic primary color system
- Added comprehensive theming documentation

---

## 🚨 Known Issues & Limitations

1. **No Authentication System**
   - Currently phone-based identification only
   - No OTP verification
   - Security risk for production

2. **Payment Mocked**
   - Payment marked as "paid" automatically
   - Razorpay integration needed

3. **No Subscription Implementation**
   - Database fields exist but not used
   - UI not implemented

4. **Limited Error Handling**
   - Basic error messages
   - No retry mechanisms
   - No offline support

5. **No Real-time Updates**
   - Booking availability requires page refresh
   - No websocket/polling for live updates

6. **Single Location**
   - No multi-location support
   - Single venue assumed

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay (when implemented)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

## 🚀 Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint and format
pnpm lint
pnpm format

# Type checking
pnpm type-check

# Apply database migrations
supabase db push

# Reset database and reseed
supabase db reset

# Generate TypeScript types from database
supabase gen types typescript --local > lib/supabase/types.ts
```

---

## 📚 Additional Documentation

- `THEMING.md` - Theme customization guide
- `SCHEMA_DESIGN.md` - Detailed database schema
- `SCHEMA_CHANGELOG.md` - Schema change history
- `IMPLEMENTATION_SUMMARY.md` - Feature implementation notes
- `QUICK_REFERENCE.md` - Quick development reference
- `DEVICE_TYPES_SYSTEM.md` - Device types documentation

---

## 🤝 Contributing Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- UPPERCASE for UI labels and headers
- Use server actions for all data operations
- Prefer composition over inheritance

### Component Structure
```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component definition
// 4. Hooks and state
// 5. Helper functions
// 6. Effects
// 7. Event handlers
// 8. Render logic
```

### Commit Messages
- Use conventional commits format
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting, missing semicolons, etc.
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

---

## 📧 Contact & Support

- Project Owner: Adithya
- Repository: Local (Git initialized)
- Last Updated: 2026-05-31

---

*This context document is maintained by Claude Code and should be updated whenever significant changes are made to the application.*
