import { configureStore } from '@reduxjs/toolkit';
import authReducer from './AuthSlice';
import cardReducer from './CardSlice';
import decksmithReducer, { saveToStorage } from './decksmithSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    card: cardReducer,
    decksmith: decksmithReducer,
  },
});

store.subscribe(() => {
  saveToStorage(store.getState().decksmith);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
