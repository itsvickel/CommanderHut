// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './AuthSlice';
import cardReducer from './CardSlice';
 
export const store = configureStore({
  reducer: {
    auth: authReducer,
    card: cardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
