import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as React from 'react';

jest.mock('../../Constants/api', () => ({
  __esModule: true,
  default: { ME: 'http://test/api/me' },
}));

import authReducer, {
  authCheckStarted,
  authCheckSucceeded,
  authCheckFailed,
} from '../../store/AuthSlice';
import useAuth from '../useAuth';

const buildStore = () =>
  configureStore({ reducer: { auth: authReducer } });

const wrapper = (store: ReturnType<typeof buildStore>) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);

const userFixture = { id: '1', username: 'ada', email_address: 'ada@example.com' };

describe('useAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('hydrates from sessionStorage without dispatching authCheckStarted', async () => {
    sessionStorage.setItem('user', JSON.stringify(userFixture));
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => userFixture,
    });

    const store = buildStore();
    const spy = jest.spyOn(store, 'dispatch');
    renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(authCheckSucceeded(userFixture));
    });
    expect(spy).not.toHaveBeenCalledWith(authCheckStarted());
  });

  it('dispatches authCheckStarted then authCheckSucceeded on cold load success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => userFixture,
    });

    const store = buildStore();
    const spy = jest.spyOn(store, 'dispatch');
    renderHook(() => useAuth(), { wrapper: wrapper(store) });

    expect(spy).toHaveBeenCalledWith(authCheckStarted());
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(authCheckSucceeded(userFixture));
    });
  });

  it('dispatches authCheckFailed when /api/me returns non-2xx', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const store = buildStore();
    const spy = jest.spyOn(store, 'dispatch');
    renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(authCheckFailed());
    });
  });

  it('dispatches authCheckFailed on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));

    const store = buildStore();
    const spy = jest.spyOn(store, 'dispatch');
    renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(authCheckFailed());
    });
  });

  it('aborts in-flight fetch on unmount', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    (global.fetch as jest.Mock).mockImplementationOnce((_url, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(abortError));
      })
    );

    const store = buildStore();
    const spy = jest.spyOn(store, 'dispatch');
    const { unmount } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    unmount();

    // Give the aborted promise a tick to reject.
    await new Promise((r) => setTimeout(r, 0));
    expect(spy).not.toHaveBeenCalledWith(authCheckFailed());
  });
});
