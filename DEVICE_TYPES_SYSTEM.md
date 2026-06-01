# Device Types System

## Overview

Centralized device type configuration system that manages pricing, player limits, and extra player charges for all device categories.

---

## Device Types Table

### Schema

```sql
CREATE TABLE public.device_types (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,                    -- Internal identifier (e.g., 'standard_snooker')
  display_name TEXT NOT NULL,                   -- User-facing name (e.g., 'Standard Snooker Table')
  
  -- Pricing
  regular_hourly_rate NUMERIC(10, 2) NOT NULL,  -- Base hourly rate
  
  -- Player Configuration
  included_players INTEGER NOT NULL,             -- Players included in base rate
  max_players INTEGER NOT NULL,                  -- Maximum players allowed
  extra_player_charge NUMERIC(10, 2) NOT NULL,   -- Charge per additional player
  
  -- Display
  description TEXT,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Device Types Configuration

Based on Break Point Arena pricing table:

| Device Type | Display Name | Hourly Rate | Included Players | Max Players | Extra Player Charge |
|-------------|--------------|-------------|------------------|-------------|---------------------|
| **standard_snooker** | Standard Snooker Table | ₹379/hr | Up to 4 | 8 | ₹79 per person |
| **medium_snooker** | Medium Snooker Table | ₹299/hr | Up to 4 | 8 | ₹79 per person |
| **american_pool** | American Pool Table | ₹249/hr | Up to 4 | 8 | ₹49 per person |
| **ps5** | PS5 Console | ₹200/hr | 1 Player | 4 | ₹150 per controller |
| **other** | Other Gaming Device | ₹200/hr | 1 Player | 4 | ₹100 per person |

---

## Player Pricing Examples

### Standard Snooker Table (₹379/hr)
- **1-4 players**: ₹379/hr (included in base rate)
- **5 players**: ₹379 + ₹79 = ₹458/hr
- **6 players**: ₹379 + (₹79 × 2) = ₹537/hr
- **7 players**: ₹379 + (₹79 × 3) = ₹616/hr
- **8 players** (max): ₹379 + (₹79 × 4) = ₹695/hr

### Medium Snooker Table (₹299/hr)
- **1-4 players**: ₹299/hr (included in base rate)
- **5 players**: ₹299 + ₹79 = ₹378/hr
- **8 players** (max): ₹299 + (₹79 × 4) = ₹615/hr

### American Pool Table (₹249/hr)
- **1-4 players**: ₹249/hr (included in base rate)
- **5 players**: ₹249 + ₹49 = ₹298/hr
- **8 players** (max): ₹249 + (₹49 × 4) = ₹445/hr

### PS5 Console (₹200/hr)
- **1 player**: ₹200/hr (included in base rate)
- **2 players**: ₹200 + ₹150 = ₹350/hr
- **3 players**: ₹200 + (₹150 × 2) = ₹500/hr
- **4 players** (max): ₹200 + (₹150 × 3) = ₹650/hr

---

## Integration with Devices Table

### Updated Devices Schema

```sql
ALTER TABLE public.devices
ADD COLUMN device_type_id UUID REFERENCES public.device_types(id);
```

Now devices reference device_types:

```sql
-- Old way (removed)
devices.type = 'PS5'
devices.hourly_rate = 200

-- New way
devices.device_type_id = <uuid-of-ps5-type>
-- Pricing comes from device_types table
```

---

## Usage in Application

### 1. Get Device Types (Admin - Add Device)

```typescript
const { data: deviceTypes } = await supabase
  .from('device_types')
  .select('*')
  .eq('is_active', true)
  .order('display_order');

// Display in dropdown:
// - Standard Snooker Table (₹379/hr)
// - Medium Snooker Table (₹299/hr)
// - American Pool Table (₹249/hr)
// - PS5 Console (₹200/hr)
// - Other Gaming Device (₹200/hr)
```

### 2. Get Device with Type Info

```typescript
const { data: device } = await supabase
  .from('devices')
  .select(`
    *,
    device_type:device_types(*)
  `)
  .eq('id', deviceId)
  .single();

// Access:
// device.device_type.regular_hourly_rate
// device.device_type.included_players
// device.device_type.max_players
// device.device_type.extra_player_charge
```

### 3. Calculate Total with Extra Players

```typescript
function calculateTotalWithPlayers(
  deviceType: DeviceType,
  numPlayers: number,
  durationHours: number
): number {
  const baseRate = deviceType.regular_hourly_rate;
  const extraPlayers = Math.max(0, numPlayers - deviceType.included_players);
  const extraCharge = extraPlayers * deviceType.extra_player_charge;
  
  return (baseRate + extraCharge) * durationHours;
}

// Example: 6 players on Standard Snooker for 2 hours
// baseRate = ₹379
// extraPlayers = 6 - 4 = 2
// extraCharge = 2 × ₹79 = ₹158
// total = (₹379 + ₹158) × 2 = ₹1074
```

### 4. Player Selection UI Component

```typescript
// Get max players for selected device type
const maxPlayers = deviceType.max_players;
const includedPlayers = deviceType.included_players;

// Show player selector
<div>
  <label>Number of Players (Up to {maxPlayers})</label>
  <select>
    {Array.from({ length: maxPlayers }, (_, i) => i + 1).map(num => (
      <option key={num} value={num}>
        {num} Player{num > 1 ? 's' : ''}
        {num > includedPlayers && 
          ` (+₹${(num - includedPlayers) * deviceType.extra_player_charge})`
        }
      </option>
    ))}
  </select>
</div>

// Output:
// 1 Player
// 2 Players
// 3 Players
// 4 Players
// 5 Players (+₹79)
// 6 Players (+₹158)
// 7 Players (+₹237)
// 8 Players (+₹316)
```

---

## Migration from Old Schema

The migration automatically:

1. Creates `device_types` table
2. Inserts 5 device types (standard_snooker, medium_snooker, american_pool, ps5, other)
3. Adds `device_type_id` column to `devices` table
4. Maps existing devices to device types based on their `type` field
5. Makes `device_type_id` required

### Mapping Logic

```sql
'PS5' → ps5
'Standard Snooker' → standard_snooker
'Medium Snooker' → medium_snooker
'American Snooker' → american_pool  -- Note: American Pool in pricing table
'Other' → other
```

---

## Database Queries

### Get Device Type Pricing

```sql
SELECT 
  name,
  display_name,
  regular_hourly_rate,
  included_players,
  max_players,
  extra_player_charge
FROM device_types
WHERE is_active = true
ORDER BY display_order;
```

### Get All Devices with Type Info

```sql
SELECT 
  d.id,
  d.station_number,
  d.status,
  dt.display_name as device_type_name,
  dt.regular_hourly_rate,
  dt.included_players,
  dt.max_players,
  dt.extra_player_charge
FROM devices d
JOIN device_types dt ON d.device_type_id = dt.id
WHERE d.status != 'inactive'
ORDER BY d.station_number;
```

### Calculate Booking Total with Extra Players

```sql
-- For a booking with 6 players on Standard Snooker for 2 hours
SELECT 
  dt.regular_hourly_rate as base_rate,
  dt.included_players,
  dt.extra_player_charge,
  (6 - dt.included_players) as extra_players,
  ((6 - dt.included_players) * dt.extra_player_charge) as extra_player_cost,
  (dt.regular_hourly_rate + ((6 - dt.included_players) * dt.extra_player_charge)) as hourly_rate_with_players,
  (dt.regular_hourly_rate + ((6 - dt.included_players) * dt.extra_player_charge)) * 2 as total_cost
FROM device_types dt
WHERE dt.name = 'standard_snooker';

-- Result:
-- base_rate: 379
-- included_players: 4
-- extra_player_charge: 79
-- extra_players: 2
-- extra_player_cost: 158
-- hourly_rate_with_players: 537
-- total_cost: 1074
```

---

## Admin Management

### Add New Device Type

```sql
INSERT INTO device_types (
  name,
  display_name,
  regular_hourly_rate,
  included_players,
  max_players,
  extra_player_charge,
  description,
  display_order
) VALUES (
  'pool_table',
  'Pool Table',
  199.00,
  2,
  4,
  50.00,
  'Standard pool table for 2-4 players',
  6
);
```

### Update Device Type Pricing

```sql
UPDATE device_types
SET 
  regular_hourly_rate = 399.00,
  extra_player_charge = 89.00,
  updated_at = NOW()
WHERE name = 'standard_snooker';
```

### Disable Device Type

```sql
UPDATE device_types
SET is_active = false
WHERE name = 'other';
```

---

## Benefits

### Before (Old System)
- ❌ Pricing hardcoded in devices
- ❌ No player limit configuration
- ❌ Extra player charges not tracked
- ❌ Changing prices requires updating multiple devices
- ❌ No central configuration

### After (Device Types System)
- ✅ Centralized pricing configuration
- ✅ Player limits enforced per device type
- ✅ Extra player charges calculated automatically
- ✅ Update one device type → affects all devices of that type
- ✅ Easy to add new device types
- ✅ Consistent pricing across the system

---

## Frontend Implementation

### Booking Flow with Players

1. **Device Selection**: Customer selects device
2. **Player Selection**: Show player selector (1 to max_players)
3. **Price Display**: Show base rate + extra player charges
4. **Slot Selection**: Choose time slot
5. **Summary**: Display breakdown with player costs
6. **Confirmation**: Create booking with player count

### Price Breakdown Example

```
Standard Snooker Table - 2 Hours
┌─────────────────────────────────────┐
│ Base Rate (Up to 4 players)  ₹758  │
│ Extra Players (2 × ₹79)       ₹158  │
│                                     │
│ Subtotal                      ₹916  │
│ GST (18%)                     ₹165  │
│ ─────────────────────────────────  │
│ TOTAL                        ₹1081  │
└─────────────────────────────────────┘
```

---

## Testing Checklist

- ✅ Device types table created with 5 types
- ✅ Existing devices migrated to device_types
- ✅ Can add new device with device type selection
- ✅ Can edit device (device type dropdown)
- ✅ Player count selector shows correct max
- ✅ Extra player charges calculated correctly
- ✅ Pricing updates centrally for all devices of same type

---

**Status**: ✅ Schema Created (Pending Application)  
**Migration**: `20260530095000_create_device_types_table.sql`  
**Last Updated**: May 30, 2026
