import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FoodCartItem {
  menu_item_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface FoodCartState {
  items: FoodCartItem[];
  bookingId: string | null;
  bookingNumber: string | null;
  customerPhone: string | null;
  customerName: string | null;
}

const initialState: FoodCartState = {
  items: [],
  bookingId: null,
  bookingNumber: null,
  customerPhone: null,
  customerName: null,
};

const foodCartSlice = createSlice({
  name: "foodCart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<FoodCartItem, "quantity">>) => {
      const existingItem = state.items.find(
        (item) => item.menu_item_id === action.payload.menu_item_id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.menu_item_id !== action.payload
      );
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ menu_item_id: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item.menu_item_id === action.payload.menu_item_id
      );

      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(
            (item) => item.menu_item_id !== action.payload.menu_item_id
          );
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },

    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (item) => item.menu_item_id === action.payload
      );
      if (item) {
        item.quantity += 1;
      }
    },

    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (item) => item.menu_item_id === action.payload
      );
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items = state.items.filter(
            (i) => i.menu_item_id !== action.payload
          );
        }
      }
    },

    setBookingContext: (
      state,
      action: PayloadAction<{
        bookingId: string;
        bookingNumber: string;
        customerPhone: string;
        customerName: string;
      }>
    ) => {
      state.bookingId = action.payload.bookingId;
      state.bookingNumber = action.payload.bookingNumber;
      state.customerPhone = action.payload.customerPhone;
      state.customerName = action.payload.customerName;
    },

    clearBookingContext: (state) => {
      state.bookingId = null;
      state.bookingNumber = null;
      state.customerPhone = null;
      state.customerName = null;
    },

    clearCart: (state) => {
      state.items = [];
      state.bookingId = null;
      state.bookingNumber = null;
      state.customerPhone = null;
      state.customerName = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  setBookingContext,
  clearBookingContext,
  clearCart,
} = foodCartSlice.actions;

export default foodCartSlice.reducer;
