export type DeviceType = 'PS5' | 'Standard Snooker' | 'Medium Snooker' | 'American Snooker'
export type DeviceStatus = 'available' | 'occupied' | 'maintenance' | 'inactive'

export interface Device {
  id: string;
  type: DeviceType;
  station_number: string;
  specs?: string;
  status: DeviceStatus;
  hourly_rate: number;
  image_url?: string,
  created_at: string;
  updated_at: string;
}

