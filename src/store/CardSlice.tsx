import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Card } from '../types/cardTypes';

// Define the state type
interface CardState {
    card: Card | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: CardState = {
    card: null,
    loading: false,
    error: null,
};

// Create slice
const cardSlice = createSlice({
    name: 'card',
    initialState,
    reducers: {
        // Set card data
        setCard: (state, action: PayloadAction<Card>) => {
            state.card = action.payload;
            state.loading = false;
            state.error = null;
        },
        // Set loading state
        setLoading: (state) => {
            state.loading = true;
        },
        // Set error message
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.loading = false;
        },
        // Reset state
        resetCard: (state) => {
            state.card = null;
            state.loading = false;
            state.error = null;
        },
    },
});

// Export actions for use in components
export const { setCard, setLoading, setError, resetCard } = cardSlice.actions;

// Export the reducer to be included in the store
export default cardSlice.reducer;
