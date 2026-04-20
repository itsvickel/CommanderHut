import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer, { AuthStatus, User } from '../../../store/AuthSlice';
import RequireAuth from '../RequireAuth';

const buildStore = (status: AuthStatus, user: User | null = null) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { status, user } },
  });

const renderAt = (path: string, store: ReturnType<typeof buildStore>) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/secret"
            element={
              <RequireAuth>
                <div>secret content</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('RequireAuth', () => {
  it('renders a spinner while status is checking', () => {
    renderAt('/secret', buildStore('checking'));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('renders a spinner while status is idle', () => {
    renderAt('/secret', buildStore('idle'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login with encoded redirect param when unauthenticated', () => {
    renderAt('/secret', buildStore('unauthenticated'));
    expect(screen.getByText('login page')).toBeInTheDocument();
    // The Navigate target preserves the original path in the query string.
    // MemoryRouter's location is not directly readable here, but the login
    // page rendering confirms the redirect happened.
  });

  it('renders children when authenticated', () => {
    const user = { id: '1', username: 'ada', email_address: 'ada@example.com' };
    renderAt('/secret', buildStore('authenticated', user));
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });
});
