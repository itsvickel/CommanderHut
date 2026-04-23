import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer, { AuthStatus, User } from '../../../store/AuthSlice';
import RequireAdmin from '../RequireAdmin';

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
          <Route path="/" element={<div>home page</div>} />
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/admin/masterprompt"
            element={
              <RequireAdmin>
                <div>admin content</div>
              </RequireAdmin>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

const adminUser: User = { id: '1', username: 'admin', email_address: 'admin@test.com', is_admin: true };
const regularUser: User = { id: '2', username: 'user', email_address: 'user@test.com', is_admin: false };

describe('RequireAdmin', () => {
  it('renders a spinner while status is checking', () => {
    renderAt('/admin/masterprompt', buildStore('checking'));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('renders a spinner while status is idle', () => {
    renderAt('/admin/masterprompt', buildStore('idle'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    renderAt('/admin/masterprompt', buildStore('unauthenticated'));
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('redirects to / when authenticated but not admin', () => {
    renderAt('/admin/masterprompt', buildStore('authenticated', regularUser));
    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated as admin', () => {
    renderAt('/admin/masterprompt', buildStore('authenticated', adminUser));
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
