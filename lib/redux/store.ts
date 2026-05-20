import { configureStore } from '@reduxjs/toolkit'
import bookingReducer from './slices/bookingSlice'
import sessionReducer from './slices/sessionSlice'
import adminReducer from './slices/adminSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      booking: bookingReducer,
      session: sessionReducer,
      admin: adminReducer,
    },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
