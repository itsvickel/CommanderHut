# Tailwind Migration + Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all styled-components with Tailwind CSS and add a persistent dark/light theme toggle in the Navbar.

**Architecture:** Install Tailwind with `darkMode: 'class'`. A `ThemeContext` sets/removes the `dark` class on `<html>` and persists to `localStorage`. Every file that imports `styled-components` is converted to use `className` with Tailwind utilities. styled-components is uninstalled at the end.

**Tech Stack:** Tailwind CSS v3, React 19, TypeScript, Jest + React Testing Library

---

## File Structure

- Create: `src/context/ThemeContext.tsx` — theme state, toggle, localStorage persistence
- Modify: `src/main.tsx` — wrap app in ThemeProvider
- Modify: `src/App.tsx` — remove MainWrapper styled component
- Modify: `src/Components/Navbar.tsx` — add theme toggle button, convert to Tailwind
- Modify: `src/Components/UI_Components/Button.tsx` — convert to Tailwind
- Modify: `src/Components/UI_Components/Input.tsx` — convert to Tailwind
- Modify: `src/Components/UI_Components/Spinner.tsx` — convert to Tailwind
- Modify: `src/Components/UI_Components/ErrorState.tsx` — convert to Tailwind
- Modify: `src/Components/Auth/RequireAuth.tsx` — convert to Tailwind
- Modify: `src/Components/Auth/RequireAdmin.tsx` — convert to Tailwind
- Modify: `src/pages/home.tsx` — convert to Tailwind
- Modify: `src/pages/Login.tsx` — convert to Tailwind
- Modify: `src/pages/RegisterUser.tsx` — convert to Tailwind
- Modify: `src/pages/AdminMasterPrompt.tsx` — convert to Tailwind
- Modify: `src/pages/CardPage.tsx` — convert to Tailwind
- Modify: `src/pages/Profile/Profile.tsx` — convert to Tailwind
- Modify: `src/pages/Sandbox.tsx` — convert to Tailwind
- Modify: `src/pages/Decksmith.tsx` — convert to Tailwind
- Modify: `src/Components/Decksmith/DeckPanelEmpty.tsx` — convert to Tailwind
- Modify: `src/Components/Decksmith/DeckPanel.tsx` — convert to Tailwind
- Modify: `src/index.css` — replace Vite defaults with Tailwind directives
- Modify: `tailwind.config.js` — created by init, configured for dark mode
- Create: `src/context/__tests__/ThemeContext.test.tsx`
- Modify: `src/Components/__tests__/Navbar.test.tsx` — add theme toggle test

---

### Task 1: Install Tailwind CSS and configure dark mode

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Install Tailwind and peer dependencies**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 2: Replace tailwind.config.js with this content**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#DDE6ED',
          main: '#27374D',
          subtext: '#3B7BA3',
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Replace src/index.css with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: Start dev server to confirm Tailwind loads without errors**

```bash
npm run dev
```

Expected: No console errors, app renders (still with styled-components, that's fine).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js postcss.config.js src/index.css package.json package-lock.json
git commit -m "feat: install tailwind css with dark mode class strategy"
```

---

### Task 2: ThemeContext — dark/light toggle with localStorage persistence

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Create: `src/context/__tests__/ThemeContext.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/context/__tests__/ThemeContext.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

const TestConsumer = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeContext', () => {
  it('defaults to light when localStorage is empty', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initialises from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles from light to dark', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles from dark back to light', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest ThemeContext.test --no-coverage
```

Expected: FAIL — "Cannot find module '../ThemeContext'"

- [ ] **Step 3: Create src/context/ThemeContext.tsx**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx jest ThemeContext.test --no-coverage
```

Expected: 4 tests pass.

- [ ] **Step 5: Update src/main.tsx to wrap app with ThemeProvider**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { store } from './store';
import { Provider } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
```

- [ ] **Step 6: Commit**

```bash
git add src/context/ThemeContext.tsx src/context/__tests__/ThemeContext.test.tsx src/main.tsx
git commit -m "feat: add ThemeContext with dark/light toggle and localStorage persistence"
```

---

### Task 3: Convert App.tsx — remove MainWrapper styled component

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace src/App.tsx with Tailwind version**

```tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
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
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppComponent />
    </Router>
  );
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count as before (58 tests, 1 pre-existing suite failure from Card.test.tsx).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: convert App.tsx MainWrapper from styled-components to Tailwind"
```

---

### Task 4: Convert Navbar with theme toggle button

**Files:**
- Modify: `src/Components/Navbar.tsx`

- [ ] **Step 1: Replace src/Components/Navbar.tsx**

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutLocal, selectAuthStatus, selectIsAdmin } from '../store/AuthSlice';
import { logoutUser } from '../services/userService.js';
import { useTheme } from '../context/ThemeContext';

interface NavLink { name: string; to: string; }

const PUBLIC_LINKS: NavLink[] = [{ name: 'Cards', to: '/cards' }];
const PROTECTED_LINKS: NavLink[] = [
  { name: 'Decks', to: '/decks' },
  { name: 'Sandbox', to: '/sandbox' },
  { name: 'AI Decksmith', to: '/decksmith' },
  { name: 'Profile', to: '/profile' },
];

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const isAdmin = useSelector(selectIsAdmin);
  const { theme, toggleTheme } = useTheme();

  const onLogout = () => {
    dispatch(logoutLocal());
    logoutUser().catch((err) => console.error('Logout request failed:', err));
    navigate('/');
  };

  const links = status === 'authenticated' ? [...PUBLIC_LINKS, ...PROTECTED_LINKS] : PUBLIC_LINKS;
  const linkClass = 'px-3 py-1 text-sm text-gray-900 dark:text-gray-100 no-underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-1">
      {links.map((item) => (
        <Link key={item.to} to={item.to} className={linkClass}>{item.name}</Link>
      ))}
      {status === 'unauthenticated' && (
        <>
          <Link to="/login" className={linkClass}>Login</Link>
          <Link to="/register" className={linkClass}>Register</Link>
        </>
      )}
      {status === 'authenticated' && isAdmin && (
        <Link to="/admin/masterprompt" className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 no-underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Admin</Link>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        {status === 'authenticated' && (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
```

- [ ] **Step 2: Run existing Navbar-related tests**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count. The Navbar tests don't test CSS so they still pass.

- [ ] **Step 3: Commit**

```bash
git add src/Components/Navbar.tsx
git commit -m "refactor: convert Navbar to Tailwind and add dark/light theme toggle"
```

---

### Task 5: Convert UI components — Button, Input, Spinner, ErrorState

**Files:**
- Modify: `src/Components/UI_Components/Button.tsx`
- Modify: `src/Components/UI_Components/Input.tsx`
- Modify: `src/Components/UI_Components/Spinner.tsx`
- Modify: `src/Components/UI_Components/ErrorState.tsx`

- [ ] **Step 1: Replace Button.tsx**

```tsx
interface Props {
  name?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Button = ({ name, onClick }: Props) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-base font-medium cursor-pointer transition-colors border-none"
  >
    {name}
  </button>
);

export default Button;
```

- [ ] **Step 2: Replace Input.tsx**

```tsx
interface Props {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  placeholder?: string;
  type?: string;
}

const Input = ({ onChange, value, placeholder, type }: Props) => (
  <input
    type={type ?? 'text'}
    onChange={onChange}
    value={value}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
);

export default Input;
```

- [ ] **Step 3: Replace Spinner.tsx**

```tsx
interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

const Spinner = ({ size = 'md', label }: Props) => (
  <div className="flex items-center justify-center p-4">
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400`}
    />
    {label && <span className="sr-only">{label}</span>}
  </div>
);

export default Spinner;
```

- [ ] **Step 4: Replace ErrorState.tsx**

```tsx
interface Props {
  message: string;
  retry?: () => void;
}

const ErrorState = ({ message, retry }: Props) => (
  <div role="alert" className="flex flex-col items-center justify-center gap-3 p-8 text-center">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 m-0">
      Something went wrong
    </h2>
    <p className="text-gray-500 dark:text-gray-400 m-0">{message}</p>
    {retry && (
      <button
        onClick={retry}
        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md text-sm cursor-pointer transition-colors border-none"
      >
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
```

- [ ] **Step 5: Run tests**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count.

- [ ] **Step 6: Commit**

```bash
git add src/Components/UI_Components/Button.tsx src/Components/UI_Components/Input.tsx src/Components/UI_Components/Spinner.tsx src/Components/UI_Components/ErrorState.tsx
git commit -m "refactor: convert UI components (Button, Input, Spinner, ErrorState) to Tailwind"
```

---

### Task 6: Convert Auth components — RequireAuth, RequireAdmin

**Files:**
- Modify: `src/Components/Auth/RequireAuth.tsx`
- Modify: `src/Components/Auth/RequireAdmin.tsx`

- [ ] **Step 1: Replace RequireAuth.tsx**

```tsx
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectAuthStatus } from '../../store/AuthSlice';
import Spinner from '../UI_Components/Spinner';

interface Props { children: ReactNode; }

const RequireAuth = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const location = useLocation();

  if (status === 'idle' || status === 'checking') return <Spinner size="lg" />;
  if (status === 'unauthenticated') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
```

- [ ] **Step 2: Replace RequireAdmin.tsx**

```tsx
import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuthStatus, selectIsAdmin } from '../../store/AuthSlice';
import Spinner from '../UI_Components/Spinner';

interface Props { children: ReactNode; }

const RequireAdmin = ({ children }: Props) => {
  const status = useSelector(selectAuthStatus);
  const isAdmin = useSelector(selectIsAdmin);

  if (status === 'idle' || status === 'checking') return <Spinner size="lg" />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RequireAdmin;
```

- [ ] **Step 3: Run tests**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count.

- [ ] **Step 4: Commit**

```bash
git add src/Components/Auth/RequireAuth.tsx src/Components/Auth/RequireAdmin.tsx
git commit -m "refactor: convert RequireAuth and RequireAdmin to Tailwind"
```

---

### Task 7: Convert pages — Login, Home, AdminMasterPrompt

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/home.tsx`
- Modify: `src/pages/AdminMasterPrompt.tsx`

- [ ] **Step 1: Replace src/pages/Login.tsx**

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input, Button } from '../Components/UI_Components';
import { loginUser } from '../services/userService';
import { authCheckSucceeded } from '../store/AuthSlice';
import { safeRedirect } from '../utils/safeRedirect';

const Authentication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    loginUser({ email_address: email, password })
      .then((res) => {
        if (res && res.data?.user) {
          dispatch(authCheckSucceeded(res.data.user));
          navigate(safeRedirect(location.search), { replace: true });
        }
      })
      .catch((err) => console.error('Login failed:', err));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
      <h2 className="text-center text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Login</h2>
      <div className="flex flex-col my-4 mx-2">
        <Input placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col my-4 mx-2">
        <Input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex justify-center mt-4">
        <Button onClick={onLogin} name="Login" />
      </div>
    </div>
  );
};

export default Authentication;
```

- [ ] **Step 2: Replace src/pages/home.tsx**

```tsx
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../store/AuthSlice';

const Home = () => {
  const isLogged = useSelector(selectIsAuthenticated);
  const username = useSelector(selectCurrentUser)?.username;

  return (
    <div className="text-center p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome to MTG AI</h1>
      {isLogged && (
        <p className="text-gray-600 dark:text-gray-400">Hello {username}, how are you doing?</p>
      )}
    </div>
  );
};

export default Home;
```

- [ ] **Step 3: Replace src/pages/AdminMasterPrompt.tsx**

```tsx
import { useState, useEffect, useRef } from 'react';
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

const labelClass = 'text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400';
const textareaClass = 'w-full box-border px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md resize-y text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

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
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await updateMasterPrompt({ role_description: roleDescription, domain_restrictions: domainRestrictions, additional_rules: additionalRules });
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400 text-sm">Loading...</div>;
  if (fetchError) return <div className="p-8 text-red-600 dark:text-red-400 text-sm">{fetchError}</div>;

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-8 text-left">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Master Prompt Editor</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Changes take effect within 60 seconds (cache TTL).</p>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Role Description</label>
          <textarea rows={4} value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className={textareaClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Domain Restrictions</label>
          <textarea rows={4} value={domainRestrictions} onChange={e => setDomainRestrictions(e.target.value)} className={textareaClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Additional Rules</label>
          <textarea rows={6} value={additionalRules} onChange={e => setAdditionalRules(e.target.value)} className={textareaClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            Output Format <span className="font-normal normal-case text-xs text-gray-400">(hardcoded — edit in source)</span>
          </label>
          <textarea rows={5} value={OUTPUT_FORMAT} readOnly className={`${textareaClass} bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-default focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600`} />
        </div>
        <div className="flex items-center justify-end gap-4">
          {saveStatus === 'error' && <p className="text-red-600 dark:text-red-400 text-sm m-0">Save failed — try again</p>}
          {saveStatus === 'success' && <p className="text-green-600 dark:text-green-400 text-sm m-0">Saved!</p>}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterPrompt;
```

- [ ] **Step 4: Run tests**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.tsx src/pages/home.tsx src/pages/AdminMasterPrompt.tsx
git commit -m "refactor: convert Login, Home, AdminMasterPrompt pages to Tailwind"
```

---

### Task 8: Convert Decksmith components — DeckPanelEmpty and DeckPanel

**Files:**
- Modify: `src/Components/Decksmith/DeckPanelEmpty.tsx`
- Modify: `src/Components/Decksmith/DeckPanel.tsx`

- [ ] **Step 1: Replace DeckPanelEmpty.tsx**

```tsx
const DeckPanelEmpty = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-8 bg-white dark:bg-gray-900">
    <div className="text-4xl">🃏</div>
    <p className="font-semibold text-gray-700 dark:text-gray-200 text-base m-0">Your deck will appear here</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
      Try: "Build me a Selesnya tokens Commander deck with Rhys the Redeemed"
    </p>
  </div>
);

export default DeckPanelEmpty;
```

- [ ] **Step 2: Replace DeckPanel.tsx**

```tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ParsedDeck } from '../../types/chat';
import { postDeckList } from '../../services/deckService';
import { selectIsAuthenticated } from '../../store/AuthSlice';
import DeckPanelEmpty from './DeckPanelEmpty';

interface Props { deck: ParsedDeck | null; }
interface HoveredCard { name: string; imageUri: string; top: number; right: number; }
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const DeckPanel = ({ deck }: Props) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<HoveredCard | null>(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  if (!deck) return <DeckPanelEmpty />;

  const handleHover = (e: React.MouseEvent<HTMLDivElement>, name: string, imageUri: string) => {
    const rowRect = e.currentTarget.getBoundingClientRect();
    const top = rowRect.top + rowRect.height / 2 - 100;
    const right = window.innerWidth - rowRect.left + 8;
    setHoveredCard({ name, imageUri, top: Math.max(0, top), right });
  };

  const handleSave = async () => {
    if (!isAuthenticated || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      const result = await postDeckList({
        commander: deck.commander,
        cards: deck.cards.map(c => ({ id: c._id, quantity: c.quantity })),
        name: `${deck.commander} deck`,
        format: 'Commander',
      });
      setSavedDeckId(result?._id ?? null);
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save deck:', err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {hoveredCard && (
        <div
          className="fixed w-48 pr-2 z-50 pointer-events-none"
          style={{ top: hoveredCard.top, right: hoveredCard.right }}
        >
          <img src={hoveredCard.imageUri} alt={hoveredCard.name} className="w-full rounded-lg shadow-2xl block" />
        </div>
      )}

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {deck.commanderImageUri && (
          <img src={deck.commanderImageUri} alt={deck.commander} className="w-full rounded-lg mb-3 block" />
        )}
        <h3 className="m-0 mb-1 text-base font-bold text-gray-900 dark:text-gray-100">{deck.commander}</h3>
        <p className="m-0 text-xs text-gray-500 dark:text-gray-400">Commander · {deck.cards.length + 1} cards</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-0.5">
        <div className="text-xs font-bold uppercase text-gray-400 tracking-widest my-2">Commander</div>
        <div
          className="flex items-baseline gap-2 py-1 border-b border-gray-50 dark:border-gray-800 cursor-default"
          onMouseEnter={e => handleHover(e, deck.commander, deck.commanderImageUri)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{deck.commander}</span>
        </div>
        <div className="text-xs font-bold uppercase text-gray-400 tracking-widest my-2">Deck ({deck.cards.length})</div>
        {deck.cards.map((card, i) => (
          <div
            key={`${card._id}-${i}`}
            className="flex items-baseline gap-2 py-1 border-b border-gray-50 dark:border-gray-800 cursor-default"
            onMouseEnter={e => handleHover(e, card.name, card.image_uris.normal ?? card.image_uris.small ?? '')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
              {card.quantity > 1 ? `${card.quantity}x ` : ''}{card.name}
            </span>
            {card.role && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded px-1 py-0.5 flex-shrink-0">
                {card.role}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col gap-1">
        {!isAuthenticated ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center m-0">Sign in to save your deck</p>
        ) : (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'success' ? 'Saved!' : 'Save Deck'}
          </button>
        )}
        {saveStatus === 'error' && <p className="text-xs text-red-600 dark:text-red-400 text-center m-0">Save failed — try again</p>}
        {savedDeckId && (
          <Link
            to={`/decks/${savedDeckId}`}
            className="block text-center text-xs text-blue-600 dark:text-blue-400 font-semibold no-underline hover:underline"
          >
            → View Deck Page
          </Link>
        )}
      </div>
    </div>
  );
};

export default DeckPanel;
```

- [ ] **Step 3: Run tests**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count.

- [ ] **Step 4: Commit**

```bash
git add src/Components/Decksmith/DeckPanelEmpty.tsx src/Components/Decksmith/DeckPanel.tsx
git commit -m "refactor: convert DeckPanel and DeckPanelEmpty to Tailwind"
```

---

### Task 9: Convert remaining large pages — RegisterUser, CardPage, Profile, Sandbox, Decksmith

**Files:**
- Modify: `src/pages/RegisterUser.tsx`
- Modify: `src/pages/CardPage.tsx`
- Modify: `src/pages/Profile/Profile.tsx`
- Modify: `src/pages/Sandbox.tsx`
- Modify: `src/pages/Decksmith.tsx`

For each file, follow this conversion pattern:
1. Remove `import styled from 'styled-components'` and any `import colors from ...`
2. Delete all `const XxxStyled = styled.xxx\`...\`` declarations at the bottom
3. On each component JSX element that used a styled component, replace the component name with the underlying HTML tag and add a `className` with equivalent Tailwind utilities

**Tailwind equivalent reference for common patterns:**

| styled-components pattern | Tailwind className |
|---|---|
| `display: flex; flex-direction: column` | `flex flex-col` |
| `display: flex; align-items: center` | `flex items-center` |
| `justify-content: center` | `justify-center` |
| `gap: 1rem` | `gap-4` |
| `padding: 2rem` | `p-8` |
| `margin: 0 auto` | `mx-auto` |
| `width: 100%` | `w-full` |
| `max-width: 400px` | `max-w-sm` |
| `background: white` | `bg-white dark:bg-gray-800` |
| `border-radius: 8px` | `rounded-lg` |
| `box-shadow: 0 10px 20px rgba(0,0,0,0.15)` | `shadow-xl` |
| `font-size: 1.5rem; font-weight: bold` | `text-2xl font-bold` |
| `color: #6b7280` | `text-gray-500 dark:text-gray-400` |
| `border: 1px solid #e5e7eb` | `border border-gray-200 dark:border-gray-700` |
| `overflow-y: auto` | `overflow-y-auto` |
| `position: fixed; top: 0` | `fixed top-0` |
| `z-index: 100` | `z-50` |

- [ ] **Step 1: Convert RegisterUser.tsx** — read the file, apply the pattern above, remove styled-components

- [ ] **Step 2: Convert CardPage.tsx** — read the file, apply the pattern above, remove styled-components

- [ ] **Step 3: Convert Profile/Profile.tsx** — read the file, apply the pattern above, remove styled-components

- [ ] **Step 4: Convert Sandbox.tsx** — read the file, apply the pattern above, remove styled-components. Note: Sandbox is 442 lines; take it section by section.

- [ ] **Step 5: Convert Decksmith.tsx** — read the file, apply the pattern, remove styled-components

- [ ] **Step 6: Run tests**

```bash
npx jest --no-coverage 2>&1 | tail -8
```

Expected: same pass count.

- [ ] **Step 7: Commit**

```bash
git add src/pages/RegisterUser.tsx src/pages/CardPage.tsx src/pages/Profile/Profile.tsx src/pages/Sandbox.tsx src/pages/Decksmith.tsx
git commit -m "refactor: convert remaining pages (RegisterUser, CardPage, Profile, Sandbox, Decksmith) to Tailwind"
```

---

### Task 10: Remove styled-components and verify

**Files:**
- Modify: `package.json` (dependency removal)

- [ ] **Step 1: Uninstall styled-components**

```bash
npm uninstall styled-components @types/styled-components
```

- [ ] **Step 2: Verify no remaining styled-components imports**

```bash
grep -r "from 'styled-components'" src/
```

Expected: no output (zero matches).

- [ ] **Step 3: Run the full test suite**

```bash
npm test -- --watchAll=false 2>&1 | tail -12
```

Expected: all tests pass (58 tests, only the pre-existing Card.test.tsx suite failure).

- [ ] **Step 4: Build to confirm no TypeScript errors**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove styled-components dependency, Tailwind migration complete"
```
