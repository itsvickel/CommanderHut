import reducer, {
  authCheckStarted,
  authCheckSucceeded,
  authCheckFailed,
  logoutLocal,
  selectAuthStatus,
  selectIsAuthenticated,
  selectCurrentUser,
} from '../AuthSlice';

describe('AuthSlice', () => {
  const user = { id: '1', username: 'ada', email_address: 'ada@example.com' };

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('has initial state idle / null', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.status).toBe('idle');
    expect(state.user).toBeNull();
  });

  it('authCheckStarted sets status to checking', () => {
    const state = reducer(undefined, authCheckStarted());
    expect(state.status).toBe('checking');
    expect(state.user).toBeNull();
  });

  it('authCheckSucceeded sets status to authenticated, stores user, writes sessionStorage', () => {
    const state = reducer(undefined, authCheckSucceeded(user));
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(user);
    expect(sessionStorage.getItem('user')).toBe(JSON.stringify(user));
  });

  it('authCheckFailed sets status to unauthenticated, clears user, clears sessionStorage', () => {
    sessionStorage.setItem('user', JSON.stringify(user));
    const prev = { status: 'checking' as const, user: null };
    const state = reducer(prev, authCheckFailed());
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('logoutLocal clears user, status, and sessionStorage', () => {
    sessionStorage.setItem('user', JSON.stringify(user));
    const prev = { status: 'authenticated' as const, user };
    const state = reducer(prev, logoutLocal());
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  describe('selectors', () => {
    const build = (status: 'idle' | 'checking' | 'authenticated' | 'unauthenticated', u = null as typeof user | null) => ({
      auth: { status, user: u },
    });

    it('selectAuthStatus returns status', () => {
      expect(selectAuthStatus(build('checking') as any)).toBe('checking');
    });

    it('selectIsAuthenticated is true only when status is authenticated', () => {
      expect(selectIsAuthenticated(build('authenticated', user) as any)).toBe(true);
      expect(selectIsAuthenticated(build('checking') as any)).toBe(false);
      expect(selectIsAuthenticated(build('unauthenticated') as any)).toBe(false);
      expect(selectIsAuthenticated(build('idle') as any)).toBe(false);
    });

    it('selectCurrentUser returns user', () => {
      expect(selectCurrentUser(build('authenticated', user) as any)).toEqual(user);
      expect(selectCurrentUser(build('unauthenticated') as any)).toBeNull();
    });
  });
});
