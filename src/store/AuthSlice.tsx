import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  username: string;
  email_address: string;
  is_admin?: boolean;
}

export type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
}

const SESSION_STORAGE_KEY = 'user';

const initialState: AuthState = {
  status: 'idle',
  user: null,
};

const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authCheckStarted(state) {
      state.status = 'checking';
    },
    authCheckSucceeded(state, action: PayloadAction<User>) {
      state.status = 'authenticated';
      state.user = action.payload;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(action.payload));
    },
    authCheckFailed(state) {
      state.status = 'unauthenticated';
      state.user = null;
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    },
    logoutLocal(state) {
      state.status = 'unauthenticated';
      state.user = null;
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    },
  },
});

export const {
  authCheckStarted,
  authCheckSucceeded,
  authCheckFailed,
  logoutLocal,
} = AuthSlice.actions;

// Legacy compatibility — old code imports `login` / `logout`; map them to new actions.
export const login = authCheckSucceeded;
export const logout = logoutLocal;

export const selectAuthStatus = (state: { auth: AuthState }): AuthStatus => state.auth.status;
export const selectIsAuthenticated = (state: { auth: AuthState }): boolean =>
  state.auth.status === 'authenticated';
export const selectCurrentUser = (state: { auth: AuthState }): User | null => state.auth.user;
export const selectIsAdmin = (state: { auth: AuthState }): boolean =>
  state.auth.user?.is_admin ?? false;

export default AuthSlice.reducer;
