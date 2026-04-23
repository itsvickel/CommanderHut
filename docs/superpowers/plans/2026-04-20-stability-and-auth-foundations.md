# Stability & Auth Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden CommanderHut's auth and error handling: protect routes, prevent page-level crashes from taking down the app, fix `useAuth`'s per-mount refetch, and replace ad-hoc `"Loading..."` strings with shared `<Spinner />` / `<ErrorState />` primitives.

**Architecture:** Single Redux `status` enum (`idle | checking | authenticated | unauthenticated`) drives two route wrappers (`<RequireAuth>`, `<PageBoundary>`) applied in `App.tsx`, plus two shared UI primitives. `useAuth` becomes a one-shot initializer with optimistic sessionStorage hydration and an `AbortController`. No new data-layer, no design-system changes.

**Tech Stack:** React 19, TypeScript, Redux Toolkit, React Router v7, styled-components, Jest + ts-jest + @testing-library/react.

**Spec:** [`docs/superpowers/specs/2026-04-19-stability-and-auth-foundations-design.md`](../specs/2026-04-19-stability-and-auth-foundations-design.md)

---

## Conventions used in this plan

- **File paths are forward-slash** relative to repo root.
- **Tests live next to their subjects in `__tests__/` folders** following the existing `Card.test.tsx` layout.
- **Every task ends with a commit.** Use the commit message shown; include the `Co-Authored-By` footer the repo uses.
- **Type imports use `import type`** where the import is type-only (TypeScript best practice; matches `@reduxjs/toolkit` convention).
- **Run commands from the repo root** (`c:/Users/Vickel/Documents/project/CommanderHut`).

## Test environment note

`src/Constants/api.ts` reads `import.meta.env.*`, which ts-jest in CJS mode cannot evaluate. All tests that would transitively load it MUST use `jest.mock('../../Constants/api', () => ({ __esModule: true, default: { /* stubbed fields */ } }))` at the top of the test file. This pattern is shown in each relevant task below. `jest.mock` is hoisted by babel-jest, so the real module is never executed during the test.

---

## Task 1: Extend `AuthSlice` with status enum, new actions, and selectors

**Files:**
- Modify: `src/store/AuthSlice.tsx`
- Create: `src/store/__tests__/AuthSlice.test.ts`

- [ ] **Step 1.1: Write the failing reducer test**

Create `src/store/__tests__/AuthSlice.test.ts`:

```ts
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
```

- [ ] **Step 1.2: Run the test; expect it to fail**

Run: `npx jest src/store/__tests__/AuthSlice.test.ts --no-coverage`
Expected: FAIL — `authCheckStarted`, `authCheckSucceeded`, `authCheckFailed`, `logoutLocal`, selectors are not exported from `AuthSlice`.

- [ ] **Step 1.3: Replace `src/store/AuthSlice.tsx` with the new implementation**

Full replacement:

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  username: string;
  email_address: string;
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

export default AuthSlice.reducer;
```

**Why the `login` / `logout` aliases:** `App.tsx`, `Login.tsx`, and `Navbar.tsx` currently import `login` and `logout`. We'll update those call sites in later tasks, but keeping the aliases for now means the app still compiles between tasks.

- [ ] **Step 1.4: Run the test; expect it to pass**

Run: `npx jest src/store/__tests__/AuthSlice.test.ts --no-coverage`
Expected: PASS, all 8 tests green.

- [ ] **Step 1.5: Commit**

```bash
git add src/store/AuthSlice.tsx src/store/__tests__/AuthSlice.test.ts
git commit -m "$(cat <<'EOF'
feat(auth): add status enum, new actions, and selectors to AuthSlice

Introduces idle/checking/authenticated/unauthenticated status, splits
auth lifecycle into authCheckStarted/Succeeded/Failed and logoutLocal,
and wires sessionStorage in the reducer. Keeps login/logout as aliases
so existing call sites compile until they're migrated.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Build `<Spinner />` UI primitive

**Files:**
- Create: `src/Components/UI_Components/Spinner.tsx`
- Create: `src/Components/UI_Components/__tests__/Spinner.test.tsx`
- Modify: `src/Components/UI_Components/index.ts`

- [ ] **Step 2.1: Write the failing test**

Create `src/Components/UI_Components/__tests__/Spinner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders with role="status" and aria-live="polite"', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders the default visually-hidden label "Loading"', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    render(<Spinner label="Fetching decks" />);
    expect(screen.getByText('Fetching decks')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2.2: Run the test; expect it to fail**

Run: `npx jest src/Components/UI_Components/__tests__/Spinner.test.tsx --no-coverage`
Expected: FAIL — module `../Spinner` does not exist.

- [ ] **Step 2.3: Implement `Spinner.tsx`**

Create `src/Components/UI_Components/Spinner.tsx`:

```tsx
import styled, { keyframes } from 'styled-components';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  size?: Size;
  label?: string;
}

const SIZE_PX: Record<Size, number> = { sm: 16, md: 32, lg: 48 };

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Circle = styled.div<{ $px: number }>`
  width: ${(p) => p.$px}px;
  height: ${(p) => p.$px}px;
  border: 3px solid #e5e7eb;
  border-top-color: #4c6ef5;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Spinner = ({ size = 'md', label = 'Loading' }: Props) => (
  <Wrapper role="status" aria-live="polite">
    <Circle $px={SIZE_PX[size]} />
    <VisuallyHidden>{label}</VisuallyHidden>
  </Wrapper>
);

export default Spinner;
```

- [ ] **Step 2.4: Run the test; expect it to pass**

Run: `npx jest src/Components/UI_Components/__tests__/Spinner.test.tsx --no-coverage`
Expected: PASS, all 3 tests green.

- [ ] **Step 2.5: Export `Spinner` from the UI_Components barrel**

Modify `src/Components/UI_Components/index.ts`:

```ts
// src/Components/UI_Components.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Label } from './Label';
export { default as Modal } from './Modal';
export { default as Spinner } from './Spinner';
```

- [ ] **Step 2.6: Commit**

```bash
git add src/Components/UI_Components/Spinner.tsx src/Components/UI_Components/__tests__/Spinner.test.tsx src/Components/UI_Components/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add accessible Spinner primitive with size variants

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Build `<ErrorState />` UI primitive

**Files:**
- Create: `src/Components/UI_Components/ErrorState.tsx`
- Create: `src/Components/UI_Components/__tests__/ErrorState.test.tsx`
- Modify: `src/Components/UI_Components/index.ts`

- [ ] **Step 3.1: Write the failing test**

Create `src/Components/UI_Components/__tests__/ErrorState.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorState from '../ErrorState';

describe('ErrorState', () => {
  it('renders the message', () => {
    render(<ErrorState message="Failed to load decks" />);
    expect(screen.getByText('Failed to load decks')).toBeInTheDocument();
  });

  it('renders a default heading', () => {
    render(<ErrorState message="x" />);
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
  });

  it('does not render "Try again" when no retry is provided', () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders "Try again" and invokes retry on click', async () => {
    const retry = jest.fn();
    render(<ErrorState message="x" retry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3.2: Run the test; expect it to fail**

Run: `npx jest src/Components/UI_Components/__tests__/ErrorState.test.tsx --no-coverage`
Expected: FAIL — module `../ErrorState` does not exist.

- [ ] **Step 3.3: Implement `ErrorState.tsx`**

Create `src/Components/UI_Components/ErrorState.tsx`:

```tsx
import styled from 'styled-components';
import colors from '../../styles/colors.js';

interface Props {
  message: string;
  retry?: () => void;
}

const ErrorState = ({ message, retry }: Props) => (
  <Wrapper role="alert">
    <Heading>Something went wrong</Heading>
    <Message>{message}</Message>
    {retry && <RetryButton onClick={retry}>Try again</RetryButton>}
  </Wrapper>
);

export default ErrorState;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
`;

const Heading = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${colors.black};
  margin: 0;
`;

const Message = styled.p`
  color: ${colors.lightGrey};
  margin: 0;
`;

const RetryButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4c6ef5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;

  &:hover {
    background-color: #3b5bdb;
  }
`;
```

- [ ] **Step 3.4: Run the test; expect it to pass**

Run: `npx jest src/Components/UI_Components/__tests__/ErrorState.test.tsx --no-coverage`
Expected: PASS, all 4 tests green.

- [ ] **Step 3.5: Export `ErrorState` from the UI_Components barrel**

Modify `src/Components/UI_Components/index.ts`:

```ts
// src/Components/UI_Components.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Label } from './Label';
export { default as Modal } from './Modal';
export { default as Spinner } from './Spinner';
export { default as ErrorState } from './ErrorState';
```

- [ ] **Step 3.6: Commit**

```bash
git add src/Components/UI_Components/ErrorState.tsx src/Components/UI_Components/__tests__/ErrorState.test.tsx src/Components/UI_Components/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add ErrorState primitive with optional retry button

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build `<PageBoundary />` error boundary

**Files:**
- Create: `src/Components/UI_Components/PageBoundary.tsx`
- Create: `src/Components/UI_Components/__tests__/PageBoundary.test.tsx`
- Modify: `src/Components/UI_Components/index.ts`

- [ ] **Step 4.1: Write the failing test**

Create `src/Components/UI_Components/__tests__/PageBoundary.test.tsx`:

```tsx
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageBoundary from '../PageBoundary';

const Boom = () => {
  throw new Error('kaboom');
};

const Toggle = () => {
  const [crashed, setCrashed] = useState(true);
  if (crashed) throw new Error('first render crash');
  return <div>recovered</div>;
};

describe('PageBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when they do not throw', () => {
    render(
      <PageBoundary>
        <div>hello</div>
      </PageBoundary>
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders ErrorState with retry when a child throws', () => {
    render(
      <PageBoundary>
        <Boom />
      </PageBoundary>
    );
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('retry resets internal state and attempts to re-render children', async () => {
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('flaky');
      return <div>stable</div>;
    };

    render(
      <PageBoundary>
        <Flaky />
      </PageBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('stable')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run the test; expect it to fail**

Run: `npx jest src/Components/UI_Components/__tests__/PageBoundary.test.tsx --no-coverage`
Expected: FAIL — module `../PageBoundary` does not exist.

- [ ] **Step 4.3: Implement `PageBoundary.tsx`**

Create `src/Components/UI_Components/PageBoundary.tsx`:

```tsx
import { Component, ReactNode } from 'react';
import ErrorState from './ErrorState';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

class PageBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('PageBoundary caught error:', error, info);
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="Something went wrong on this page."
          retry={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

export default PageBoundary;
```

- [ ] **Step 4.4: Run the test; expect it to pass**

Run: `npx jest src/Components/UI_Components/__tests__/PageBoundary.test.tsx --no-coverage`
Expected: PASS, all 3 tests green. (Note: React will still log "The above error..." messages to `console.error`; the `beforeAll` mock silences them.)

- [ ] **Step 4.5: Export `PageBoundary` from the UI_Components barrel**

Modify `src/Components/UI_Components/index.ts` — add one line:

```ts
export { default as PageBoundary } from './PageBoundary';
```

Final `index.ts`:

```ts
// src/Components/UI_Components.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Label } from './Label';
export { default as Modal } from './Modal';
export { default as Spinner } from './Spinner';
export { default as ErrorState } from './ErrorState';
export { default as PageBoundary } from './PageBoundary';
```

- [ ] **Step 4.6: Commit**

```bash
git add src/Components/UI_Components/PageBoundary.tsx src/Components/UI_Components/__tests__/PageBoundary.test.tsx src/Components/UI_Components/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add PageBoundary error boundary with retry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Rewrite `useAuth` with optimistic hydrate + AbortController

**Files:**
- Modify: `src/hooks/useAuth.ts`
- Create: `src/hooks/__tests__/useAuth.test.ts`

The rewrite reads the ME endpoint from `src/Constants/api.ts` so tests can mock the Constants module to avoid `import.meta.env`.

- [ ] **Step 5.1: Write the failing test**

Create `src/hooks/__tests__/useAuth.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

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
```

- [ ] **Step 5.2: Run the test; expect it to fail**

Run: `npx jest src/hooks/__tests__/useAuth.test.ts --no-coverage`
Expected: FAIL — `useAuth` currently dispatches `login`/`logout` not `authCheck*` actions, does not hydrate from sessionStorage, and does not use AbortController.

- [ ] **Step 5.3: Rewrite `src/hooks/useAuth.ts`**

Full replacement:

```ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import API_ENDPOINT from '../Constants/api';
import {
  authCheckStarted,
  authCheckSucceeded,
  authCheckFailed,
  User,
} from '../store/AuthSlice';

const SESSION_STORAGE_KEY = 'user';

const readCachedUser = (): User | null => {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const cached = readCachedUser();
    if (cached) {
      dispatch(authCheckSucceeded(cached));
    } else {
      dispatch(authCheckStarted());
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(API_ENDPOINT.ME, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok) {
          dispatch(authCheckFailed());
          return;
        }
        const user = (await res.json()) as User;
        dispatch(authCheckSucceeded({
          id: user.id,
          username: user.username,
          email_address: user.email_address,
        }));
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        dispatch(authCheckFailed());
      }
    })();

    return () => {
      controller.abort();
    };
  }, [dispatch]);
};

export default useAuth;
```

- [ ] **Step 5.4: Run the test; expect it to pass**

Run: `npx jest src/hooks/__tests__/useAuth.test.ts --no-coverage`
Expected: PASS, all 5 tests green.

- [ ] **Step 5.5: Commit**

```bash
git add src/hooks/useAuth.ts src/hooks/__tests__/useAuth.test.ts
git commit -m "$(cat <<'EOF'
feat(auth): rewrite useAuth with optimistic hydrate and AbortController

One-shot initializer: reads cached user from sessionStorage before the
network round-trip, then reconciles with /api/me. Aborts in-flight
request on unmount to silence React Strict Mode and prevent stale
dispatches after navigation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Build `<RequireAuth>` route guard

**Files:**
- Create: `src/Components/Auth/RequireAuth.tsx`
- Create: `src/Components/Auth/__tests__/RequireAuth.test.tsx`

- [ ] **Step 6.1: Write the failing test**

Create `src/Components/Auth/__tests__/RequireAuth.test.tsx`:

```tsx
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
```

- [ ] **Step 6.2: Run the test; expect it to fail**

Run: `npx jest src/Components/Auth/__tests__/RequireAuth.test.tsx --no-coverage`
Expected: FAIL — module `../RequireAuth` does not exist.

- [ ] **Step 6.3: Implement `RequireAuth.tsx`**

Create `src/Components/Auth/RequireAuth.tsx`:

```tsx
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectAuthStatus } from '../../store/AuthSlice';
import Spinner from '../UI_Components/Spinner';

interface Props {
  children: ReactNode;
}

const RequireAuth = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const location = useLocation();

  if (status === 'idle' || status === 'checking') {
    return <Spinner />;
  }

  if (status === 'unauthenticated') {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
```

- [ ] **Step 6.4: Run the test; expect it to pass**

Run: `npx jest src/Components/Auth/__tests__/RequireAuth.test.tsx --no-coverage`
Expected: PASS, all 4 tests green.

- [ ] **Step 6.5: Commit**

```bash
git add src/Components/Auth/RequireAuth.tsx src/Components/Auth/__tests__/RequireAuth.test.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add RequireAuth route guard with spinner and redirect-preserving login hop

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Wire `<PageBoundary>` and `<RequireAuth>` into `App.tsx` routes

**Files:**
- Modify: `src/App.tsx`

This task has no unit test — it's a wiring change. Manual verification happens in Task 14.

- [ ] **Step 7.1: Replace `src/App.tsx` with the updated routing**

Full replacement:

```tsx
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import { ReactElement } from 'react';

import AIGenerate from './pages/AIGenerate';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ProfilePage from './pages/Profile/Profile';
import Home from './pages/home';
import DeckList from './Components/Deck/DeckList';

import colors from './styles/colors';
import useAuth from './hooks/useAuth';
import PageBoundary from './Components/UI_Components/PageBoundary';
import RequireAuth from './Components/Auth/RequireAuth';

const publicRoute = (element: ReactElement) => <PageBoundary>{element}</PageBoundary>;
const protectedRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAuth>{element}</RequireAuth>
  </PageBoundary>
);

const AppComponent = () => {
  useAuth();

  return (
    <MainWrapper>
      <Navbar />
      <Routes>
        <Route path="/" element={publicRoute(<Home />)} />
        <Route path="/cards" element={publicRoute(<CardPage />)} />
        <Route path="/login" element={publicRoute(<Login />)} />
        <Route path="/register" element={publicRoute(<RegisterUser />)} />
        <Route path="/decks" element={protectedRoute(<DeckPage />)} />
        <Route path="/decks/:id" element={protectedRoute(<DeckList />)} />
        <Route path="/sandbox" element={protectedRoute(<Sandbox />)} />
        <Route path="/decksmith" element={protectedRoute(<AIGenerate />)} />
        <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
      </Routes>
    </MainWrapper>
  );
};

export default function App() {
  return (
    <Router>
      <AppComponent />
    </Router>
  );
}

const MainWrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  align-items: center;
  margin: 0;

  background: linear-gradient(135deg, #f9fafb, #e5e7eb);
  color: ${colors.black};
`;
```

**Changes from prior version:**
- Removed the local `useEffect` that read sessionStorage and dispatched `login` (now owned by `useAuth`).
- Removed `navigationObj` with empty-string `name` entries (Navbar now reads auth from Redux directly — Task 8).
- Removed the unused `useState` import and `Title` import.
- Wrapped each route element with `publicRoute` / `protectedRoute` helpers.
- `Navbar` is called with no props — `Navbar.tsx` signature changes in Task 8.

- [ ] **Step 7.2: Verify the app still compiles (no runtime test yet)**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: TypeScript errors only about `Navbar` no longer accepting an `obj` prop. Those are resolved in Task 8, so the app won't compile cleanly until Tasks 7 and 8 are both done. **Do not commit yet — do Tasks 7 and 8 as one atomic commit in Step 8.6.**

*(Skip commit here; Step 8.6 commits both files together.)*

---

## Task 8: Make `Navbar` auth-aware; wire Logout

**Files:**
- Modify: `src/Components/Navbar.tsx`

- [ ] **Step 8.1: Replace `src/Components/Navbar.tsx` with the auth-aware version**

Full replacement:

```tsx
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import {
  logoutLocal,
  selectAuthStatus,
} from '../store/AuthSlice';
import { logoutUser } from '../services/userService.js';
import colors from '../styles/colors.js';
import Button from './UI_Components/Button.js';

interface NavLink {
  name: string;
  to: string;
}

const PUBLIC_LINKS: NavLink[] = [
  { name: 'Cards', to: '/cards' },
];

const PROTECTED_LINKS: NavLink[] = [
  { name: 'Decks', to: '/decks' },
  { name: 'Sandbox', to: '/sandbox' },
  { name: 'AI Decksmith', to: '/decksmith' },
  { name: 'Profile', to: '/profile' },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);

  const onLogout = () => {
    dispatch(logoutLocal());
    logoutUser().catch((err) => console.error('Logout request failed:', err));
    navigate('/');
  };

  const links = status === 'authenticated'
    ? [...PUBLIC_LINKS, ...PROTECTED_LINKS]
    : PUBLIC_LINKS;

  return (
    <NavigationContainer>
      {links.map((item) => (
        <LinkItem key={item.to} to={item.to}>{item.name}</LinkItem>
      ))}
      {status === 'unauthenticated' && (
        <>
          <LinkItem to="/login">Login</LinkItem>
          <LinkItem to="/register">Register</LinkItem>
        </>
      )}
      {status === 'authenticated' && (
        <Button onClick={onLogout} name="Logout" />
      )}
    </NavigationContainer>
  );
};

export default Navbar;

const NavigationContainer = styled.div`
  position: fixed;
  top: 0px;
  width: 100%;
  margin: 2% 0;
`;

const LinkItem = styled(Link)`
  margin: 3%;
  padding: 2%;
  color: ${colors.black};
  text-decoration: none;
`;
```

**Notes:**
- When status is `idle` or `checking`, neither block renders on the right — no flicker.
- The old `name?: string` shape on `Button` allows passing `name="Logout"` unchanged.
- Removed the stray `background:` declaration with no value from the prior `NavigationContainer` (it was a no-op anyway and caused a CSS warning).

- [ ] **Step 8.2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: Clean compile (no errors). If there are errors, they're from Task 9/10/11/12/13 call sites that still import the old `login`/`logout` names from `authSlice` — those compile only because of the compatibility aliases we kept in Task 1. Fix anything else before proceeding.

- [ ] **Step 8.3: Run full test suite to confirm nothing regressed**

Run: `npx jest --no-coverage`
Expected: All tests from Tasks 1-6 still pass. Existing tests (Card.test.tsx, AIGenerate.test.tsx) may already be broken for unrelated reasons — compare to pre-change baseline.

- [ ] **Step 8.4: Commit**

```bash
git add src/App.tsx src/Components/Navbar.tsx
git commit -m "$(cat <<'EOF'
feat(app): wire PageBoundary + RequireAuth into routes; auth-aware Navbar

Every route element is wrapped in a PageBoundary; protected routes
additionally go through RequireAuth. Navbar now reads auth status from
Redux, hides protected links when unauthenticated, and handles Logout
locally + fire-and-forget server-side.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Login honors `?redirect=` param

**Files:**
- Modify: `src/pages/Login.tsx`

- [ ] **Step 9.1: Replace `src/pages/Login.tsx`**

Full replacement:

```tsx
import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { Input, Button } from '../Components/UI_Components';
import { loginUser } from '../services/userService';
import { authCheckSucceeded } from '../store/AuthSlice';

const safeRedirect = (search: string): string => {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect');
  if (redirect && redirect.startsWith('/')) return redirect;
  return '/';
};

const Authentication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const onLogin = () => {
    loginUser({ email_address: email, password })
      .then((res) => {
        if (res && res.data?.user) {
          dispatch(authCheckSucceeded(res.data.user));
          navigate(safeRedirect(location.search), { replace: true });
        }
      })
      .catch((err) => {
        console.error('Login failed:', err);
      });
  };

  return (
    <Wrapper>
      <Title>Login</Title>
      <InputContainer>
        <Input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
      </InputContainer>
      <InputContainer>
        <Input placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      </InputContainer>

      <Button onClick={onLogin} name="Login" />
    </Wrapper>
  );
};

export default Authentication;

const Wrapper = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 5% 2%;
`;
```

**Changes:**
- Replaced `login` import with `authCheckSucceeded` (the real action; AuthSlice also persists sessionStorage now, so we don't call `sessionStorage.setItem` here anymore).
- Added `safeRedirect(search)` guarding against open-redirect (only allow paths starting with `/`).
- Removed the `useNavigate` → `/` hard-coded redirect.
- Fixed `overflow-y: scrol` typo by removing the line (never worked).

- [ ] **Step 9.2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: Clean compile.

- [ ] **Step 9.3: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "$(cat <<'EOF'
feat(auth): Login dispatches authCheckSucceeded and honors ?redirect= param

Open-redirect guard: only accept redirect targets that start with '/'.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Register honors `?redirect=` param

**Files:**
- Modify: `src/pages/RegisterUser.tsx`

- [ ] **Step 10.1: Replace `src/pages/RegisterUser.tsx`**

Full replacement:

```tsx
import { useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { postRegisterUser } from '../services/userService';
import { postProfile } from '../services/profileService';
import { Button, Input } from '../Components/UI_Components';
import { authCheckSucceeded } from '../store/AuthSlice';

const safeRedirect = (search: string): string => {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect');
  if (redirect && redirect.startsWith('/')) return redirect;
  return '/';
};

const RegisterUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');

  const registerNewUser = async () => {
    try {
      const registered = await postRegisterUser({
        username,
        email_address: emailAddress,
        password,
      });

      if (!registered?.user?._id) {
        console.error('Registration response missing user id');
        return;
      }

      await postProfile({ user_id: registered.user._id });

      dispatch(authCheckSucceeded({
        id: registered.user._id,
        username: registered.user.username,
        email_address: registered.user.email_address,
      }));

      navigate(safeRedirect(location.search), { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <PageWrapper>
      <Card>
        <Title>Register</Title>

        <InputContainer>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </InputContainer>

        <InputContainer>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </InputContainer>

        <InputContainer>
          <Input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Your email"
          />
        </InputContainer>

        <Button onClick={registerNewUser} name="Register" />

        <FooterText>
          Already have an account? <a href="/login">Login</a>
        </FooterText>
      </Card>
    </PageWrapper>
  );
};

export default RegisterUser;

const PageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
`;

const Card = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const FooterText = styled.p`
  margin-top: 1rem;
  font-size: 0.875rem;
  text-align: center;
  color: #6b7280;

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }
`;
```

- [ ] **Step 10.2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: Clean compile.

- [ ] **Step 10.3: Commit**

```bash
git add src/pages/RegisterUser.tsx
git commit -m "$(cat <<'EOF'
feat(auth): Register dispatches authCheckSucceeded and honors ?redirect= param

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `CardPage` uses Spinner and ErrorState

**Files:**
- Modify: `src/pages/CardPage.tsx`

- [ ] **Step 11.1: Replace `src/pages/CardPage.tsx`**

Full replacement:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchCardByName, fetchListOfRandomCards } from '../services/cardService';
import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';
import CardItem from '../Components/Card/CardItem';

interface Card {
  name: string;
  image_uris: { normal: string };
  oracle_text: string;
}

const CardPage = () => {
  const [listOfCards, setListOfCards] = useState<Card[]>([]);
  const [cardInput, setCardInput] = useState<string>('');
  const [searchedCards, setSearchedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const random = await fetchListOfRandomCards(20);
      setListOfCards(random);
    } catch {
      setError('Failed to load cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRandom();
  }, [loadRandom]);

  const searchCardByName = () => {
    if (!cardInput.trim()) return;
    fetchCardByName(cardInput)
      .then((item) => setSearchedCards(item))
      .catch(() => setError('Search failed.'));
    setCardInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') searchCardByName();
  };

  const displayListofCards = (cards: Card[]) =>
    cards.map((card, index) => <CardItem key={index} obj={card} />);

  if (loading) return <Spinner label="Loading cards" />;
  if (error) return <ErrorState message={error} retry={loadRandom} />;

  return (
    <Wrapper>
      <SearchSection>
        <Title>Magic: The Gathering Cards</Title>
        <SearchBar>
          <StyledInput
            value={cardInput}
            onChange={(e) => setCardInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by card name..."
          />
          <StyledButton onClick={searchCardByName} name="Search" />
        </SearchBar>
      </SearchSection>

      <CardGrid>
        {searchedCards.length > 0
          ? displayListofCards(searchedCards)
          : displayListofCards(listOfCards)}
      </CardGrid>
    </Wrapper>
  );
};

export default CardPage;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #f9fafb;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const SearchSection = styled.div`
  width: 100%;
  max-width: 800px;
  background: #fff;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const StyledInput = styled(Input)`
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
`;

const StyledButton = styled(Button)`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }
`;

const CardGrid = styled.div`
  width: 100%;
  max-width: 90vw;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  justify-items: center;
  padding-bottom: 2rem;
  max-height: 60vh;
  overflow-y: scroll;
`;
```

- [ ] **Step 11.2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: Clean compile.

- [ ] **Step 11.3: Commit**

```bash
git add src/pages/CardPage.tsx
git commit -m "$(cat <<'EOF'
feat(cards): CardPage uses Spinner / ErrorState with retry

Replaces swallowed console.log catch with user-visible error surface.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `DeckPage` uses Spinner and ErrorState

**Files:**
- Modify: `src/pages/DeckPage.tsx`

- [ ] **Step 12.1: Replace `src/pages/DeckPage.tsx`**

Full replacement:

```tsx
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { fetchAllDecks } from '../services/deckService';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const DeckPage = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllDecks();
      setDecks(res ?? []);
    } catch (err) {
      console.error('Error fetching decks:', err);
      setError('Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const navigateToDeckList = (id: string) => navigate(`/decks/${id}`);

  if (loading) return <Spinner label="Loading decks" />;
  if (error) return <ErrorState message={error} retry={load} />;

  return (
    <PageWrapper>
      <SectionTitle>Your Decks</SectionTitle>
      <DeckList>
        {decks.length === 0 ? (
          <NoDecks>No decks found. Create one!</NoDecks>
        ) : (
          decks.map((item) => (
            <DeckCard key={item._id} onClick={() => navigateToDeckList(item._id)}>
              <DeckCommanderImage
                src={item.commander_image || '/images/placeholder_commander.png'}
                alt={`${item.deck_name} Commander`}
              />
              <DeckInfo>
                <DeckTitle>{item.deck_name}</DeckTitle>
                <DeckDetails>
                  <DetailItem><strong>Owner:</strong> {item.owner_email || 'Anonymous'}</DetailItem>
                  <DetailItem>
                    <strong>Last Updated:</strong> {new Date(item.updated_at).toLocaleDateString()}
                  </DetailItem>
                </DeckDetails>
              </DeckInfo>
            </DeckCard>
          ))
        )}
      </DeckList>
    </PageWrapper>
  );
};

export default DeckPage;

const PageWrapper = styled.div`
  width: 90%;
  max-width: 960px;
  margin: 3rem auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 2.5rem;
  text-align: center;
  color: #222;
  font-weight: 700;
`;

const DeckList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  overflow-y: scroll;
  max-height: 70vh;
`;

const NoDecks = styled.p`
  font-size: 1.2rem;
  text-align: center;
  color: #666;
  grid-column: 1 / -1;
`;

const DeckCard = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }

  &:hover img { transform: scale(1.1); }
`;

const DeckCommanderImage = styled.img`
  width: 160px;
  height: 224px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
  margin: 0 auto 1rem;
  background-color: #f9f9f9;
  transition: transform 0.5s ease;
  will-change: transform;
`;

const DeckInfo = styled.div`
  padding: 1rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const DeckTitle = styled.h3`
  font-size: 1.6rem;
  margin-bottom: 0.75rem;
  color: #111;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeckDetails = styled.div`
  margin-top: auto;
  color: #555;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailItem = styled.span`
  font-weight: 500;
  color: #666;
`;
```

- [ ] **Step 12.2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: Clean compile.

- [ ] **Step 12.3: Commit**

```bash
git add src/pages/DeckPage.tsx
git commit -m "$(cat <<'EOF'
feat(decks): DeckPage uses Spinner / ErrorState with retry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: `AIGenerate` uses Spinner and ErrorState

**Files:**
- Modify: `src/pages/AIGenerate.tsx`

- [ ] **Step 13.1: Replace `src/pages/AIGenerate.tsx`**

Full replacement:

```tsx
import { useState } from 'react';
import styled from 'styled-components';
import { fetchCardByName } from '../services/cardService';
import { fetchMTGIdea } from '../services/aiService';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const AIGenerate = () => {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<object[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawAIText, setRawAIText] = useState('');

  const handleGenerateCards = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setCards([]);
    setRawAIText('');

    try {
      const aiText = await fetchMTGIdea(query);
      setRawAIText(aiText);

      const cardNameMatches = [...aiText.matchAll(/\*\*(.+?)\*\*/g)];
      const cardNames = cardNameMatches.map((m) => m[1]);

      if (cardNames.length === 0) {
        setError('No card names were found in the AI response.');
        return;
      }

      for (const name of cardNames) {
        try {
          const res = await fetchCardByName(name);
          if (res) setCards((prev) => [...prev, res]);
        } catch (cardErr) {
          console.warn(`Could not fetch card: ${name}`, cardErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>AI-Generated MTG Cards</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask the AI to generate card ideas..."
      />

      <button onClick={handleGenerateCards} disabled={loading}>
        Generate Cards
      </button>

      {loading && <Spinner label="Generating cards" />}
      {error && !loading && <ErrorState message={error} retry={handleGenerateCards} />}

      {!loading && rawAIText && (
        <RawTextContainer>{rawAIText}</RawTextContainer>
      )}

      {!loading && cards.length > 0 && (
        <Column>
          {cards.map((item: any, index) => (
            <Card key={index}>
              <img src={item?.image_uris?.normal} alt={item?.name} />
              <p>{item?.name}</p>
            </Card>
          ))}
        </Column>
      )}
    </Container>
  );
};

export default AIGenerate;

const Container = styled.div`
  max-width: auto;
  margin: 2rem auto;
  padding: 1rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 5px #ccc;
  input {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1rem;
  }
  button {
    width: 100%;
    padding: 0.7rem;
    background-color: #2563eb;
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    &:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
    }
  }
`;

const Column = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: auto;
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  img { width: 80px; border-radius: 8px; }
  p { font-weight: 600; }
`;

const RawTextContainer = styled.div`
  height: 40vh;
  width: 50vw;
  font-weight: bold;
  font-size: 1.5em;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  max-height: 40vh;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  color: #111827;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;
```

- [ ] **Step 13.2: Verify TypeScript compiles**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: Clean compile.

- [ ] **Step 13.3: Commit**

```bash
git add src/pages/AIGenerate.tsx
git commit -m "$(cat <<'EOF'
feat(ai): AIGenerate uses Spinner / ErrorState with retry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Full test run + manual acceptance verification

**Files:** none (verification only)

- [ ] **Step 14.1: Run the full Jest suite**

Run: `npx jest --no-coverage`
Expected: All new tests from Tasks 1-6 pass. Existing baseline tests (`Card.test.tsx`, `AIGenerate.test.tsx`) should be in the same state as before this plan started. If we accidentally regressed them, fix or record them as pre-existing failures in the commit message of the follow-up.

- [ ] **Step 14.2: Start the dev server**

Run: `npm run dev`
Expected: Vite serves the app locally. Open the printed URL (likely `http://localhost:5173`).

- [ ] **Step 14.3: Verify acceptance criteria in the browser**

Walk through each spec criterion and confirm:

1. While logged out, visit `/profile` → redirected to `/login?redirect=%2Fprofile`. Log in → land on `/profile`.
2. Repeat the previous step for `/decks`, `/decks/abc`, `/sandbox`, `/decksmith`.
3. In DevTools console, temporarily throw an error from inside `CardPage` (e.g., replace `loadRandom`'s first `await` line with `throw new Error('test')`), reload `/cards` → `<ErrorState>` fallback appears, the Navbar is still clickable, "Try again" resets state. Revert the change before committing anything.
4. With a valid sessionStorage user, reload `/profile` → no visible `/login` redirect flash.
5. Open the Network tab, load the app cold → exactly one completed `/api/me` request. (Dev Strict Mode may show two; the first is `cancelled`.)
6. Log out → Navbar shows `Cards / Login / Register`. Log in → Navbar shows `Cards / Decks / Sandbox / AI Decksmith / Profile / Logout`. No empty text nodes.
7. Click Logout from any page → land on `/`; sessionStorage cleared (check Application tab).
8. Toggle network to "Offline" then load `/cards` / `/decks` / `/decksmith` → each shows `<ErrorState>` with a retry button.

- [ ] **Step 14.4: If all criteria pass, tag the completed workstream**

```bash
git log --oneline -20
```

Sanity check: ~13 commits added on top of `6e3afae` (the `update profile` commit). If they're all present and all green, the workstream is ready for PR.

---

## File Inventory (for reviewer)

**New files:**
- `src/Components/Auth/RequireAuth.tsx`
- `src/Components/Auth/__tests__/RequireAuth.test.tsx`
- `src/Components/UI_Components/Spinner.tsx`
- `src/Components/UI_Components/ErrorState.tsx`
- `src/Components/UI_Components/PageBoundary.tsx`
- `src/Components/UI_Components/__tests__/Spinner.test.tsx`
- `src/Components/UI_Components/__tests__/ErrorState.test.tsx`
- `src/Components/UI_Components/__tests__/PageBoundary.test.tsx`
- `src/store/__tests__/AuthSlice.test.ts`
- `src/hooks/__tests__/useAuth.test.ts`

**Edited files:**
- `src/store/AuthSlice.tsx`
- `src/hooks/useAuth.ts`
- `src/App.tsx`
- `src/Components/Navbar.tsx`
- `src/Components/UI_Components/index.ts`
- `src/pages/Login.tsx`
- `src/pages/RegisterUser.tsx`
- `src/pages/CardPage.tsx`
- `src/pages/DeckPage.tsx`
- `src/pages/AIGenerate.tsx`
