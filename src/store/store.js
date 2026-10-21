import { configureStore } from '@reduxjs/toolkit';

import prayerReducer from './prayerSlice';

export const store = configureStore({
  reducer: {
    prayer: prayerReducer,
  },
});