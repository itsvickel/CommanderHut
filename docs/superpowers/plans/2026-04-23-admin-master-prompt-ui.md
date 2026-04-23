# Admin Master Prompt UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a protected `/admin/masterprompt` page where admins can view and edit the three master prompt sections, backed by the existing `GET/PUT /api/admin/masterprompt` endpoints.

**Architecture:** Backend `authController.js` is updated (on the `masterprompt-admin` branch) to include `is_admin` via a DB lookup in the check-auth response. The frontend adds `is_admin?: boolean` to the `User` type, a `RequireAdmin` route guard, an `adminService` for the two endpoints, and an `AdminMasterPrompt` page component. Route is wired in `App.tsx`.

**Tech Stack:** React 19, TypeScript, styled-components, React Router v7, Redux Toolkit, axios, Jest + React Testing Library

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `CommanderHut-backend/controllers/authController.js` | Include `is_admin` in check-auth response (DB lookup) |
| Modify | `src/store/AuthSlice.tsx` | Add `is_admin?: boolean` to `User`; add `selectIsAdmin` selector |
| Modify | `src/hooks/useAuth.ts` | Fix user extraction from response; pass `is_admin` through |
| Create | `src/Components/Auth/RequireAdmin.tsx` | Route guard — redirects non-admins |
| Create | `src/Components/Auth/__tests__/RequireAdmin.test.tsx` | Tests for `RequireAdmin` |
| Create | `src/services/adminService.ts` | `getMasterPrompt` / `updateMasterPrompt` |
| Create | `src/pages/AdminMasterPrompt.tsx` | Admin form page |
| Create | `src/pages/__tests__/AdminMasterPrompt.test.tsx` | Tests for the page |
| Modify | `src/App.tsx` | Add `adminRoute` helper + `/admin/masterprompt` route |

---

### Task 0: Backend — include `is_admin` in check-auth response

**Context:** The backend lives in `CommanderHut-backend/`. The admin work (User model with `is_admin` field, admin middleware, admin routes) is on the `masterprompt-admin` branch. This task updates `authController.js` on that branch to do a DB lookup and return `is_admin`.

**Files:**
- Modify: `CommanderHut-backend/controllers/authController.js`

- [ ] **Step 1: Switch to the `masterprompt-admin` branch in the backend**

```bash
cd CommanderHut-backend
git checkout masterprompt-admin
```

- [ ] **Step 2: Replace `authController.js` with the updated version that includes `is_admin`**

Replace the full contents of `controllers/authController.js`:

```javascript
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const checkAuth = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await User.findById(decoded.id).select('is_admin').lean();
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        id: decoded.id,
        email_address: decoded.email_address,
        username: decoded.username,
        is_admin: dbUser?.is_admin ?? false,
      },
    });
  } catch (err) {
    return res.status(401).json({ isAuthenticated: false });
  }
};

export default checkAuth;
```

- [ ] **Step 3: Run the backend test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass (78 tests). If any auth-related test fails because it asserts the old shape, update it to include `is_admin: false` in the expected user object.

- [ ] **Step 4: Commit**

```bash
git add controllers/authController.js
git commit -m "feat: include is_admin in check-auth response"
```

---

### Task 1: Frontend — extend `User` type, add `selectIsAdmin`, fix `useAuth`

**Context:** The frontend lives in `CommanderHut/` on the `ai-chat-deck` branch. `useAuth.ts` currently extracts user fields explicitly — it also has a pre-existing bug where `res.json()` returns `{ isAuthenticated, user: {...} }` but the code reads top-level fields instead of `data.user`. This task fixes that bug and adds `is_admin` support.

**Files:**
- Modify: `src/store/AuthSlice.tsx`
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Add `is_admin?: boolean` to `User` interface and add `selectIsAdmin` in `AuthSlice.tsx`**

In `src/store/AuthSlice.tsx`, change the `User` interface and add the selector:

```typescript
export interface User {
  id: string;
  username: string;
  email_address: string;
  is_admin?: boolean;
}
```

Add this selector after the existing `selectCurrentUser`:

```typescript
export const selectIsAdmin = (state: { auth: AuthState }): boolean =>
  state.auth.user?.is_admin ?? false;
```

- [ ] **Step 2: Fix `useAuth.ts` to correctly extract `data.user` and include `is_admin`**

In `src/hooks/useAuth.ts`, replace the fetch dispatch block with corrected logic:

```typescript
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
        const data = await res.json();
        const user = data.user;
        dispatch(authCheckSucceeded({
          id: user.id,
          username: user.username,
          email_address: user.email_address,
          is_admin: user.is_admin ?? false,
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

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/AuthSlice.tsx src/hooks/useAuth.ts
git commit -m "feat: add is_admin to User type and fix useAuth response extraction"
```

---

### Task 2: `RequireAdmin` component with tests

**Context:** Mirrors the existing `RequireAuth` component at `src/Components/Auth/RequireAuth.tsx`. Shows a spinner while auth is resolving, redirects to `/login` if unauthenticated, redirects to `/` if authenticated but not admin, renders children if admin.

**Files:**
- Create: `src/Components/Auth/__tests__/RequireAdmin.test.tsx`
- Create: `src/Components/Auth/RequireAdmin.tsx`

- [ ] **Step 1: Write the failing tests in `src/Components/Auth/__tests__/RequireAdmin.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest RequireAdmin.test --no-coverage
```

Expected: FAIL — "Cannot find module '../RequireAdmin'"

- [ ] **Step 3: Implement `RequireAdmin.tsx`**

Create `src/Components/Auth/RequireAdmin.tsx`:

```tsx
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuthStatus, selectIsAdmin } from '../../store/AuthSlice';
import Spinner from '../UI_Components/Spinner';

interface Props {
  children: ReactNode;
}

const RequireAdmin = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const isAdmin = useSelector(selectIsAdmin);

  if (status === 'idle' || status === 'checking') return <Spinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

export default RequireAdmin;
```

- [ ] **Step 4: Run tests — all 5 should pass**

```bash
npx jest RequireAdmin.test --no-coverage
```

Expected: 5 tests pass ✅

- [ ] **Step 5: Commit**

```bash
git add src/Components/Auth/RequireAdmin.tsx src/Components/Auth/__tests__/RequireAdmin.test.tsx
git commit -m "feat: add RequireAdmin route guard"
```

---

### Task 3: Admin service

**Files:**
- Create: `src/services/adminService.ts`

- [ ] **Step 1: Create `src/services/adminService.ts`**

```typescript
import axios from 'axios';

export interface MasterPromptData {
  role_description: string;
  domain_restrictions: string;
  additional_rules: string;
}

export const getMasterPrompt = async (): Promise<MasterPromptData> => {
  const res = await axios.get('/api/admin/masterprompt', { withCredentials: true });
  return res.data;
};

export const updateMasterPrompt = async (data: MasterPromptData): Promise<MasterPromptData> => {
  const res = await axios.put('/api/admin/masterprompt', data, { withCredentials: true });
  return res.data;
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/adminService.ts
git commit -m "feat: add adminService for GET/PUT master prompt"
```

---

### Task 4: `AdminMasterPrompt` page with tests

**Files:**
- Create: `src/pages/__tests__/AdminMasterPrompt.test.tsx`
- Create: `src/pages/AdminMasterPrompt.tsx`

- [ ] **Step 1: Write failing tests in `src/pages/__tests__/AdminMasterPrompt.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/AuthSlice';
import AdminMasterPrompt from '../AdminMasterPrompt';
import { getMasterPrompt, updateMasterPrompt } from '../../services/adminService';

jest.mock('../../services/adminService', () => ({
  getMasterPrompt: jest.fn(),
  updateMasterPrompt: jest.fn(),
}));

const buildStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        status: 'authenticated' as const,
        user: { id: '1', username: 'admin', email_address: 'admin@test.com', is_admin: true },
      },
    },
  });

const renderPage = () =>
  render(
    <Provider store={buildStore()}>
      <MemoryRouter>
        <AdminMasterPrompt />
      </MemoryRouter>
    </Provider>
  );

const mockData = {
  role_description: 'You are a deck builder',
  domain_restrictions: 'MTG only',
  additional_rules: 'Use real card names',
};

describe('AdminMasterPrompt', () => {
  beforeEach(() => {
    (getMasterPrompt as jest.Mock).mockResolvedValue(mockData);
    (updateMasterPrompt as jest.Mock).mockResolvedValue(mockData);
  });

  it('loads and displays prompt data on mount', async () => {
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    expect(screen.getByDisplayValue('MTG only')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Use real card names')).toBeInTheDocument();
  });

  it('shows Save Changes button after data loads', async () => {
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows Saved! after successful save', async () => {
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    fireEvent.click(screen.getByText('Save Changes'));
    await screen.findByText('Saved!');
  });

  it('shows error message when save fails', async () => {
    (updateMasterPrompt as jest.Mock).mockRejectedValue(new Error('Server error'));
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    fireEvent.click(screen.getByText('Save Changes'));
    await screen.findByText('Save failed — try again');
  });

  it('shows fetch error when getMasterPrompt fails', async () => {
    (getMasterPrompt as jest.Mock).mockRejectedValue(new Error('403'));
    renderPage();
    await screen.findByText(/Failed to load master prompt/);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest AdminMasterPrompt.test --no-coverage
```

Expected: FAIL — "Cannot find module '../AdminMasterPrompt'"

- [ ] **Step 3: Implement `src/pages/AdminMasterPrompt.tsx`**

```tsx
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getMasterPrompt, updateMasterPrompt } from '../services/adminService';

const OUTPUT_FORMAT =
  'Output ONLY valid JSON — no markdown, no bold (**), no explanation, no code fences.\n' +
  'Required JSON keys:\n' +
  '  commander: string (exact real Magic: The Gathering card name)\n' +
  '  color_identity: array of letters from W U B R G only\n' +
  '  strategy: string, max 400 chars\n' +
  '  signature_cards: array of objects, each with:\n' +
  '    name: string (exact real Magic: The Gathering card name)\n' +
  '    role: one of win_con | ramp | draw | removal | interaction | synergy | utility\n' +
  'Do not invent card names.';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const AdminMasterPrompt = () => {
  const [roleDescription, setRoleDescription] = useState('');
  const [domainRestrictions, setDomainRestrictions] = useState('');
  const [additionalRules, setAdditionalRules] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMasterPrompt();
        setRoleDescription(data.role_description);
        setDomainRestrictions(data.domain_restrictions);
        setAdditionalRules(data.additional_rules);
      } catch {
        setFetchError('Failed to load master prompt. You may not have admin access.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await updateMasterPrompt({
        role_description: roleDescription,
        domain_restrictions: domainRestrictions,
        additional_rules: additionalRules,
      });
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) return <PageWrapper><LoadingMsg>Loading...</LoadingMsg></PageWrapper>;
  if (fetchError) return <PageWrapper><ErrorMsg>{fetchError}</ErrorMsg></PageWrapper>;

  return (
    <PageWrapper>
      <PageTitle>Master Prompt Editor</PageTitle>
      <PageSubtitle>Changes take effect within 60 seconds (cache TTL).</PageSubtitle>

      <Form>
        <Section>
          <Label>Role Description</Label>
          <Textarea
            rows={4}
            value={roleDescription}
            onChange={e => setRoleDescription(e.target.value)}
          />
        </Section>

        <Section>
          <Label>Domain Restrictions</Label>
          <Textarea
            rows={4}
            value={domainRestrictions}
            onChange={e => setDomainRestrictions(e.target.value)}
          />
        </Section>

        <Section>
          <Label>Additional Rules</Label>
          <Textarea
            rows={6}
            value={additionalRules}
            onChange={e => setAdditionalRules(e.target.value)}
          />
        </Section>

        <Section>
          <Label>
            Output Format{' '}
            <ReadOnlyBadge>(hardcoded — edit in source)</ReadOnlyBadge>
          </Label>
          <ReadOnlyTextarea rows={5} value={OUTPUT_FORMAT} readOnly />
        </Section>

        <Footer>
          {saveStatus === 'error' && <ErrorMsg>Save failed — try again</ErrorMsg>}
          {saveStatus === 'success' && <SuccessMsg>Saved!</SuccessMsg>}
          <SaveButton onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </SaveButton>
        </Footer>
      </Form>
    </PageWrapper>
  );
};

export default AdminMasterPrompt;

const PageWrapper = styled.div`
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  text-align: left;
`;

const PageTitle = styled.h2`
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
`;

const PageSubtitle = styled.p`
  margin: 0 0 2rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
`;

const ReadOnlyBadge = styled.span`
  font-weight: 400;
  text-transform: none;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  font-size: 0.875rem;
  font-family: monospace;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  color: #374151;
  background: #fff;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
`;

const ReadOnlyTextarea = styled(Textarea)`
  background: #f3f4f6;
  color: #9ca3af;
  cursor: default;
  border-color: #e5e7eb;
  &:focus {
    border-color: #e5e7eb;
    box-shadow: none;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
`;

const SaveButton = styled.button`
  padding: 0.6rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }
`;

const LoadingMsg = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
`;

const ErrorMsg = styled.p`
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
`;

const SuccessMsg = styled.p`
  color: #16a34a;
  font-size: 0.875rem;
  margin: 0;
`;
```

- [ ] **Step 4: Run tests — all 5 should pass**

```bash
npx jest AdminMasterPrompt.test --no-coverage
```

Expected: 5 tests pass ✅

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/AdminMasterPrompt.tsx src/pages/__tests__/AdminMasterPrompt.test.tsx
git commit -m "feat: add AdminMasterPrompt page"
```

---

### Task 5: Wire up the admin route in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `App.tsx` to add the `adminRoute` helper and the `/admin/masterprompt` route**

Replace the full contents of `src/App.tsx`:

```tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import { ReactElement } from 'react';

import Decksmith from './pages/Decksmith';
import Navbar from './Components/Navbar';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ProfilePage from './pages/Profile/Profile';
import Home from './pages/home';
import DeckList from './Components/Deck/DeckList';
import AdminMasterPrompt from './pages/AdminMasterPrompt';

import colors from './styles/colors';
import useAuth from './hooks/useAuth';
import PageBoundary from './Components/UI_Components/PageBoundary';
import RequireAuth from './Components/Auth/RequireAuth';
import RequireAdmin from './Components/Auth/RequireAdmin';

const publicRoute = (element: ReactElement) => <PageBoundary>{element}</PageBoundary>;
const protectedRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAuth>{element}</RequireAuth>
  </PageBoundary>
);
const adminRoute = (element: ReactElement) => (
  <PageBoundary>
    <RequireAdmin>{element}</RequireAdmin>
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
        <Route path="/decksmith" element={protectedRoute(<Decksmith />)} />
        <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
        <Route path="/admin/masterprompt" element={adminRoute(<AdminMasterPrompt />)} />
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

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass, including the 5 new `RequireAdmin` tests and the 5 new `AdminMasterPrompt` tests.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /admin/masterprompt route with RequireAdmin guard"
```
