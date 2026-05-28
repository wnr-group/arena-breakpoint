import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface BookingState {
  // Device selection
  deviceId: string | null
  deviceName: string | null
  deviceType: string | null
  hourlyRate: number | null

  // Slot selection
  selectedDate: string | null
  selectedSlot: string | null
  slotStartTime: string | null
  slotEndTime: string | null

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
  deviceId: null,
  deviceName: null,
  deviceType: null,
  hourlyRate: null,
  selectedDate: null,
  selectedSlot: null,
  slotStartTime: null,
  slotEndTime: null,
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
    setDevice: (
      state,
      action: PayloadAction<{
        id: string
        name: string
        type: string
        hourlyRate: number
      }>
    ) => {
      state.deviceId = action.payload.id
      state.deviceName = action.payload.name
      state.deviceType = action.payload.type
      state.hourlyRate = action.payload.hourlyRate
    },

    setSlot: (
      state,
      action: PayloadAction<{
        date: string
        slot: string
        startTime: string
        endTime: string
      }>
    ) => {
      state.selectedDate = action.payload.date
      state.selectedSlot = action.payload.slot
      state.slotStartTime = action.payload.startTime
      state.slotEndTime = action.payload.endTime
    },

    addAddon: (
      state,
      action: PayloadAction<{
        id: string
        name: string
        price: number
      }>
    ) => {
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

    setPricing: (
      state,
      action: PayloadAction<{
        subtotal: number
        subscriptionDiscount: number
        promoDiscount: number
        total: number
      }>
    ) => {
      state.subtotal = action.payload.subtotal
      state.subscriptionDiscount = action.payload.subscriptionDiscount
      state.promoDiscount = action.payload.promoDiscount
      state.total = action.payload.total
    },

    setPromoCode: (state, action: PayloadAction<string | null>) => {
      state.promoCode = action.payload
    },

    setCustomerDetails: (
      state,
      action: PayloadAction<{
        phone: string
        name: string
        email?: string
      }>
    ) => {
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
  setDevice,
  setSlot,
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
