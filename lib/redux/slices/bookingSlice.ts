import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BookingState {
  // Device Type selection (not individual device)
  deviceTypeId: string | null
  deviceTypeName: string | null
  hourlyRate: number | null
  includedPlayers: number
  maxPlayers: number
  extraPlayerCharge: number

  // Assigned device (auto-assigned after booking)
  assignedDeviceId: string | null
  assignedStationNumber: string | null

  // Slot selection
  selectedDate: string | null
  selectedSlot: string | null
  slotStartTime: string | null
  slotEndTime: string | null
  playerCount: number

  // Add-ons
  addons: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>

  // Pricing
  subtotal: number
  subscriptionDiscount: number
  promoDiscount: number
  promoCode: string | null
  total: number

  // Customer details
  phone: string | null
  name: string | null
  email: string | null

  // Booking state
  bookingId: string | null
  slotLockExpiry: number | null
}

const initialState: BookingState = {
  deviceTypeId: null,
  deviceTypeName: null,
  hourlyRate: null,
  includedPlayers: 1,
  maxPlayers: 1,
  extraPlayerCharge: 0,
  assignedDeviceId: null,
  assignedStationNumber: null,
  selectedDate: null,
  selectedSlot: null,
  slotStartTime: null,
  slotEndTime: null,
  playerCount: 1,
  addons: [],
  subtotal: 0,
  subscriptionDiscount: 0,
  promoDiscount: 0,
  promoCode: null,
  total: 0,
  phone: null,
  name: null,
  email: null,
  bookingId: null,
  slotLockExpiry: null,
}

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setDeviceType: (state, action: PayloadAction<{
      id: string
      name: string
      hourlyRate: number
      includedPlayers: number
      maxPlayers: number
      extraPlayerCharge: number
    }>) => {
      state.deviceTypeId = action.payload.id
      state.deviceTypeName = action.payload.name
      state.hourlyRate = action.payload.hourlyRate
      state.includedPlayers = action.payload.includedPlayers
      state.maxPlayers = action.payload.maxPlayers
      state.extraPlayerCharge = action.payload.extraPlayerCharge
      state.playerCount = action.payload.includedPlayers // Reset to included players when device type changes
    },

    setAssignedDevice: (state, action: PayloadAction<{
      deviceId: string
      stationNumber: string
    }>) => {
      state.assignedDeviceId = action.payload.deviceId
      state.assignedStationNumber = action.payload.stationNumber
    },

    setPlayerCount: (state, action: PayloadAction<number>) => {
      state.playerCount = action.payload
    },

    setSlot: (state, action: PayloadAction<{
      date: string
      slot: string
      startTime: string
      endTime: string
    }>) => {
      state.selectedDate = action.payload.date
      state.selectedSlot = action.payload.slot
      state.slotStartTime = action.payload.startTime
      state.slotEndTime = action.payload.endTime
    },

    addAddon: (state, action: PayloadAction<{
      id: string
      name: string
      price: number
    }>) => {
      const existing = state.addons.find(a => a.id === action.payload.id)
      if (existing) {
        existing.quantity += 1
      } else {
        state.addons.push({ ...action.payload, quantity: 1 })
      }
    },

    removeAddon: (state, action: PayloadAction<string>) => {
      const index = state.addons.findIndex(a => a.id === action.payload)
      if (index !== -1) {
        if (state.addons[index].quantity > 1) {
          state.addons[index].quantity -= 1
        } else {
          state.addons.splice(index, 1)
        }
      }
    },

    setPricing: (state, action: PayloadAction<{
      subtotal: number
      subscriptionDiscount: number
      promoDiscount: number
      total: number
    }>) => {
      state.subtotal = action.payload.subtotal
      state.subscriptionDiscount = action.payload.subscriptionDiscount
      state.promoDiscount = action.payload.promoDiscount
      state.total = action.payload.total
    },

    setPromoCode: (state, action: PayloadAction<string | null>) => {
      state.promoCode = action.payload
    },

    setCustomerDetails: (state, action: PayloadAction<{
      phone: string
      name: string
      email?: string
    }>) => {
      state.phone = action.payload.phone
      state.name = action.payload.name
      state.email = action.payload.email || null
    },

    setBookingId: (state, action: PayloadAction<string>) => {
      state.bookingId = action.payload
    },

    setSlotLockExpiry: (state, action: PayloadAction<number>) => {
      state.slotLockExpiry = action.payload
    },

    resetBooking: () => initialState,
  },
})

export const {
  setDeviceType,
  setAssignedDevice,
  setSlot,
  setPlayerCount,
  addAddon,
  removeAddon,
  setPricing,
  setPromoCode,
  setCustomerDetails,
  setBookingId,
  setSlotLockExpiry,
  resetBooking,
} = bookingSlice.actions

export default bookingSlice.reducer