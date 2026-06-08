# Phase 2a — Shared Layout + Decksmith Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed top navbar with a persistent top-bar + icon sidebar shell, then redesign Decksmith into a ChatGPT-style three-panel workspace (sessions history | chat | deck panel) backed by a Redux slice persisted to localStorage.

**Architecture:** A new `AppLayout` component (TopBar + Sidebar + content slot) wraps all routes in `App.tsx`, removing `Navbar.tsx` entirely. A new `decksmithSlice` stores sessions in Redux and syncs to localStorage via `store.subscribe()`. Decksmith.tsx becomes a thin connector that reads/writes the slice while keeping ephemeral loading state local.

**Tech Stack:** React 18, TypeScript, Redux Toolkit, Tailwind CSS, Jest + @testing-library/react (jsdom), React Router v6.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/store/decksmithSlice.ts` |
| Create | `src/store/__tests__/decksmithSlice.test.ts` |
| Create | `src/Components/Layout/AppLayout.tsx` |
| Create | `src/Components/Layout/TopBar.tsx` |
| Create | `src/Components/Layout/Sidebar.tsx` |
| Create | `src/Components/Decksmith/SessionsPanel.tsx` |
| Modify | `src/store/index.ts` |
| Modify | `src/App.tsx` |
| Modify | `src/pages/Decksmith.tsx` |
| Modify | `src/Components/Chat/MessageList.tsx` |
| Modify | `src/Components/Decksmith/DeckPanel.tsx` |
| Delete | `src/Components/Navbar.tsx` |

---

## Task 1: decksmithSlice — write failing tests

**Files:**
- Create: `src/store/__tests__/decksmithSlice.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// src/store/__tests__/decksmithSlice.test.ts
import reducer, {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  selectSessions,
  selectActiveSessionId,
  selectActiveSession,
  loadFromStorage,
  DecksmithSession,
  DecksmithState,
} from '../decksmithSlice';
import { Message, ParsedDeck } from '../../types/chat';

// jsdom provides localStorage — clear it between tests
beforeEach(() => localStorage.clear());

// Stable mock for crypto.randomUUID
let uuidCounter = 0;
beforeEach(() => { uuidCounter = 0; });
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
  configurable: true,
});

const EMPTY: DecksmithState = { sessions: [], activeSessionId: null };

describe('decksmithSlice', () => {
  it('returns empty state when localStorage is empty', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state.sessions).toEqual([]);
    expect(state.activeSessionId).toBeNull();
  });

  describe('createSession', () => {
    it('adds a new session and sets it as active', () => {
      const state = reducer(EMPTY, createSession());
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].title).toBe('New session');
      expect(state.sessions[0].messages).toEqual([]);
      expect(state.sessions[0].deck).toBeNull();
      expect(state.activeSessionId).toBe(state.sessions[0].id);
    });

    it('prepends new session and sets it as active', () => {
      const s1 = reducer(EMPTY, createSession());
      const s2 = reducer(s1, createSession());
      expect(s2.sessions).toHaveLength(2);
      expect(s2.activeSessionId).toBe(s2.sessions[0].id);
    });
  });

  describe('setActiveSession', () => {
    it('switches active to an existing session', () => {
      let state = reducer(EMPTY, createSession());
      const firstId = state.sessions[0].id;
      state = reducer(state, createSession());
      state = reducer(state, setActiveSession(firstId));
      expect(state.activeSessionId).toBe(firstId);
    });

    it('ignores unknown session id', () => {
      const state = reducer(EMPTY, createSession());
      const next = reducer(state, setActiveSession('nonexistent'));
      expect(next.activeSessionId).toBe(state.activeSessionId);
    });
  });

  describe('appendMessage', () => {
    it('appends a message to the correct session', () => {
      const state = reducer(EMPTY, createSession());
      const sessionId = state.sessions[0].id;
      const msg: Message = { role: 'user', content: 'hello', timestamp: 1 };
      const next = reducer(state, appendMessage({ sessionId, message: msg }));
      expect(next.sessions[0].messages).toHaveLength(1);
      expect(next.sessions[0].messages[0]).toEqual(msg);
    });

    it('ignores unknown sessionId', () => {
      const state = reducer(EMPTY, createSession());
      const msg: Message = { role: 'user', content: 'hi', timestamp: 1 };
      const next = reducer(state, appendMessage({ sessionId: 'bad', message: msg }));
      expect(next.sessions[0].messages).toHaveLength(0);
    });
  });

  describe('setDeck', () => {
    it('stores deck on the correct session', () => {
      const state = reducer(EMPTY, createSession());
      const sessionId = state.sessions[0].id;
      const deck: ParsedDeck = { commander: 'Krenko, Mob Boss', cards: [], strategy: 'Goblins' };
      const next = reducer(state, setDeck({ sessionId, deck }));
      expect(next.sessions[0].deck).toEqual(deck);
    });
  });

  describe('updateSessionTitle', () => {
    it('updates title for the matching session', () => {
      const state = reducer(EMPTY, createSession());
      const sessionId = state.sessions[0].id;
      const next = reducer(state, updateSessionTitle({ sessionId, title: 'Krenko Goblins' }));
      expect(next.sessions[0].title).toBe('Krenko Goblins');
    });

    it('ignores unknown sessionId', () => {
      const state = reducer(EMPTY, createSession());
      const next = reducer(state, updateSessionTitle({ sessionId: 'bad', title: 'X' }));
      expect(next.sessions[0].title).toBe('New session');
    });
  });

  describe('selectors', () => {
    it('selectSessions returns sessions array', () => {
      const state = reducer(EMPTY, createSession());
      expect(selectSessions({ decksmith: state })).toHaveLength(1);
    });

    it('selectActiveSessionId returns activeSessionId', () => {
      const state = reducer(EMPTY, createSession());
      expect(selectActiveSessionId({ decksmith: state })).toBe(state.sessions[0].id);
    });

    it('selectActiveSession returns the active session object', () => {
      const state = reducer(EMPTY, createSession());
      const active = selectActiveSession({ decksmith: state });
      expect(active?.id).toBe(state.activeSessionId);
    });

    it('selectActiveSession returns null when no active session', () => {
      expect(selectActiveSession({ decksmith: EMPTY })).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    it('returns default state when localStorage is empty', () => {
      expect(loadFromStorage()).toEqual({ sessions: [], activeSessionId: null });
    });

    it('returns parsed state when localStorage has valid data', () => {
      const saved: DecksmithState = {
        sessions: [{ id: 'a', title: 'Test', messages: [], deck: null, createdAt: '2026-01-01' }],
        activeSessionId: 'a',
      };
      localStorage.setItem('decksmith', JSON.stringify(saved));
      expect(loadFromStorage()).toEqual(saved);
    });

    it('returns default state when localStorage has malformed JSON', () => {
      localStorage.setItem('decksmith', 'not-json');
      expect(loadFromStorage()).toEqual({ sessions: [], activeSessionId: null });
    });
  });
});
```

- [ ] **Step 2: Run the tests — verify they fail**

```
npm test -- --testPathPattern=decksmithSlice
```

Expected: FAIL — "Cannot find module '../decksmithSlice'"

---

## Task 2: decksmithSlice — implementation

**Files:**
- Create: `src/store/decksmithSlice.ts`

- [ ] **Step 1: Create the slice**

```ts
// src/store/decksmithSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ParsedDeck } from '../types/chat';

export interface DecksmithSession {
  id: string;
  title: string;
  messages: Message[];
  deck: ParsedDeck | null;
  createdAt: string;
}

export interface DecksmithState {
  sessions: DecksmithSession[];
  activeSessionId: string | null;
}

const STORAGE_KEY = 'decksmith';
const DEFAULT_STATE: DecksmithState = { sessions: [], activeSessionId: null };

export function loadFromStorage(): DecksmithState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.sessions)) return parsed as DecksmithState;
  } catch { /* ignore parse errors */ }
  return DEFAULT_STATE;
}

export function saveToStorage(state: DecksmithState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore quota errors */ }
}

const decksmithSlice = createSlice({
  name: 'decksmith',
  initialState: loadFromStorage(),
  reducers: {
    createSession(state) {
      const id = crypto.randomUUID();
      state.sessions.unshift({
        id,
        title: 'New session',
        messages: [],
        deck: null,
        createdAt: new Date().toISOString(),
      });
      state.activeSessionId = id;
    },
    setActiveSession(state, action: PayloadAction<string>) {
      if (state.sessions.some(s => s.id === action.payload)) {
        state.activeSessionId = action.payload;
      }
    },
    appendMessage(state, action: PayloadAction<{ sessionId: string; message: Message }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.messages.push(action.payload.message);
    },
    setDeck(state, action: PayloadAction<{ sessionId: string; deck: ParsedDeck }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.deck = action.payload.deck;
    },
    updateSessionTitle(state, action: PayloadAction<{ sessionId: string; title: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) session.title = action.payload.title;
    },
  },
});

export const {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
} = decksmithSlice.actions;

export const selectSessions = (state: { decksmith: DecksmithState }) =>
  state.decksmith.sessions;
export const selectActiveSessionId = (state: { decksmith: DecksmithState }) =>
  state.decksmith.activeSessionId;
export const selectActiveSession = (state: { decksmith: DecksmithState }) =>
  state.decksmith.sessions.find(s => s.id === state.decksmith.activeSessionId) ?? null;

export default decksmithSlice.reducer;
```

- [ ] **Step 2: Run the tests — verify they pass**

```
npm test -- --testPathPattern=decksmithSlice
```

Expected: PASS — all 16 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add src/store/decksmithSlice.ts src/store/__tests__/decksmithSlice.test.ts
git commit -m "feat: add decksmithSlice with localStorage persistence"
```

---

## Task 3: Wire decksmithSlice into the Redux store

**Files:**
- Modify: `src/store/index.ts`

- [ ] **Step 1: Update `src/store/index.ts`**

Replace the entire file:

```ts
// src/store/index.ts
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
```

- [ ] **Step 2: Run all tests to verify no breakage**

```
npm test
```

Expected: same number of passing tests as before (authSlice + cardSlice + decksmithSlice all pass).

- [ ] **Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "feat: register decksmithSlice in Redux store with localStorage sync"
```

---

## Task 4: TopBar component

**Files:**
- Create: `src/Components/Layout/TopBar.tsx`

- [ ] **Step 1: Create the directory and file**

```tsx
// src/Components/Layout/TopBar.tsx
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutLocal, selectAuthStatus } from '../../store/AuthSlice';
import { logoutUser } from '../../services/userService.js';
import { useTheme } from '../../context/ThemeContext';

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

const TopBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const { theme, toggleTheme } = useTheme();

  const onLogout = () => {
    dispatch(logoutLocal());
    logoutUser().catch((err) => console.error('Logout failed:', err));
    navigate('/login');
  };

  return (
    <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
      <span className="font-bold text-base text-gray-900 dark:text-gray-100 select-none">
        ⚔ CommanderHut
      </span>
      <div className="flex items-center gap-2">
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
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors border-none cursor-pointer"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
```

- [ ] **Step 2: Run tests — verify no breakage**

```
npm test
```

Expected: all existing tests still pass (TopBar has no test file — it will be visually verified after App.tsx is wired up).

---

## Task 5: Sidebar component

**Files:**
- Create: `src/Components/Layout/Sidebar.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/Components/Layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthStatus } from '../../store/AuthSlice';

interface NavItem {
  label: string;
  icon: string;
  to: string;
  requiresAuth: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'AI Decksmith', icon: '🤖', to: '/decksmith', requiresAuth: true },
  { label: 'My Decks',     icon: '🃏', to: '/decks',     requiresAuth: true },
  { label: 'Cards',        icon: '🔍', to: '/cards',     requiresAuth: false },
  { label: 'Sandbox',      icon: '⚡', to: '/sandbox',   requiresAuth: false },
];

const Sidebar = () => {
  const location = useLocation();
  const isAuthenticated = useSelector(selectAuthStatus) === 'authenticated';

  const iconBtn = (to: string, icon: string, label: string) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        key={to}
        to={to}
        title={label}
        aria-label={label}
        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-colors ${
          isActive
            ? 'bg-amber-500 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
        }`}
      >
        {icon}
      </Link>
    );
  };

  return (
    <aside className="flex-shrink-0 w-16 bg-gray-800 flex flex-col items-center py-3 gap-1">
      {NAV_ITEMS.filter(item => !item.requiresAuth || isAuthenticated).map(item =>
        iconBtn(item.to, item.icon, item.label)
      )}
      {isAuthenticated && (
        <div className="mt-auto">
          {iconBtn('/profile', '👤', 'Profile')}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
```

- [ ] **Step 2: Run tests — verify no breakage**

```
npm test
```

Expected: all existing tests still pass.

---

## Task 6: AppLayout component

**Files:**
- Create: `src/Components/Layout/AppLayout.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/Components/Layout/AppLayout.tsx
import { ReactNode } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
    <TopBar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  </div>
);

export default AppLayout;
```

- [ ] **Step 2: Run tests**

```
npm test
```

Expected: all tests pass.

---

## Task 7: Wire AppLayout into App.tsx — remove Navbar

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
// src/App.tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ReactElement } from 'react';

import Decksmith from './pages/Decksmith';
import AppLayout from './Components/Layout/AppLayout';
import CardPage from './pages/CardPage';
import DeckPage from './pages/DeckPage';
import Sandbox from './pages/Sandbox';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ProfilePage from './pages/Profile/Profile';
import Home from './pages/home';
import EditDeck from './pages/EditDeck';
import AdminMasterPrompt from './pages/AdminMasterPrompt';
import DeckDetailPage from './pages/DeckDetailPage';

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
    <AppLayout>
      <Routes>
        <Route path="/" element={publicRoute(<Home />)} />
        <Route path="/cards" element={publicRoute(<CardPage />)} />
        <Route path="/login" element={publicRoute(<Login />)} />
        <Route path="/register" element={publicRoute(<RegisterUser />)} />
        <Route path="/decks" element={protectedRoute(<DeckPage />)} />
        <Route path="/decks/:id" element={publicRoute(<DeckDetailPage />)} />
        <Route path="/decks/:id/edit" element={protectedRoute(<EditDeck />)} />
        <Route path="/sandbox" element={publicRoute(<Sandbox />)} />
        <Route path="/decksmith" element={protectedRoute(<Decksmith />)} />
        <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
        <Route path="/admin/masterprompt" element={adminRoute(<AdminMasterPrompt />)} />
      </Routes>
    </AppLayout>
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

- [ ] **Step 2: Delete `src/Components/Navbar.tsx`**

```bash
git rm src/Components/Navbar.tsx
```

- [ ] **Step 3: Run tests**

```
npm test
```

Expected: all tests pass. (If any test imports Navbar, update it — but no test file imports Navbar.)

- [ ] **Step 4: Start the dev server and verify the layout visually**

```
npm run dev
```

Open http://localhost:5173. You should see: 48px top bar with "⚔ CommanderHut" brand + theme toggle + logout. 64px dark sidebar on the left with icon buttons. Page content in the remaining area. The old top navbar is gone.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/Components/Layout/
git commit -m "feat: add AppLayout shell (TopBar + Sidebar), remove Navbar"
```

---

## Task 8: SessionsPanel component + tests

**Files:**
- Create: `src/Components/Decksmith/SessionsPanel.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/Components/Decksmith/__tests__/SessionsPanel.test.tsx`:

```tsx
// src/Components/Decksmith/__tests__/SessionsPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SessionsPanel from '../SessionsPanel';
import { DecksmithSession } from '../../../store/decksmithSlice';

const makeSession = (id: string, title: string, createdAt: string): DecksmithSession => ({
  id,
  title,
  messages: [],
  deck: null,
  createdAt,
});

describe('SessionsPanel', () => {
  const sessions = [
    makeSession('1', 'Krenko Goblins', new Date().toISOString()),
    makeSession('2', 'Atraxa Counters', new Date(Date.now() - 86400000).toISOString()),
  ];

  it('renders all session titles', () => {
    render(
      <SessionsPanel
        sessions={sessions}
        activeSessionId="1"
        onSelectSession={jest.fn()}
        onNewSession={jest.fn()}
      />
    );
    expect(screen.getByText('Krenko Goblins')).toBeInTheDocument();
    expect(screen.getByText('Atraxa Counters')).toBeInTheDocument();
  });

  it('calls onSelectSession with the session id when a session is clicked', () => {
    const onSelect = jest.fn();
    render(
      <SessionsPanel
        sessions={sessions}
        activeSessionId="1"
        onSelectSession={onSelect}
        onNewSession={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('Atraxa Counters'));
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('calls onNewSession when the New session button is clicked', () => {
    const onNew = jest.fn();
    render(
      <SessionsPanel
        sessions={sessions}
        activeSessionId="1"
        onSelectSession={jest.fn()}
        onNewSession={onNew}
      />
    );
    fireEvent.click(screen.getByText('+ New session'));
    expect(onNew).toHaveBeenCalled();
  });

  it('renders an empty state with no sessions', () => {
    render(
      <SessionsPanel
        sessions={[]}
        activeSessionId={null}
        onSelectSession={jest.fn()}
        onNewSession={jest.fn()}
      />
    );
    expect(screen.getByText('+ New session')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```
npm test -- --testPathPattern=SessionsPanel
```

Expected: FAIL — "Cannot find module '../SessionsPanel'"

- [ ] **Step 3: Implement `SessionsPanel`**

```tsx
// src/Components/Decksmith/SessionsPanel.tsx
import { DecksmithSession } from '../../store/decksmithSlice';

interface Props {
  sessions: DecksmithSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

function relativeDate(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(isoString).toLocaleDateString();
}

const SessionsPanel = ({ sessions, activeSessionId, onSelectSession, onNewSession }: Props) => (
  <div className="flex-shrink-0 w-[220px] bg-gray-800 flex flex-col border-r border-gray-700">
    <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
      Sessions
    </div>
    <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-2">
      {sessions.map(session => {
        const isActive = session.id === activeSessionId;
        return (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors border-l-2 ${
              isActive
                ? 'bg-gray-700 border-amber-400 text-gray-100'
                : 'border-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="font-medium truncate">{session.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{relativeDate(session.createdAt)}</div>
          </button>
        );
      })}
    </div>
    <div className="px-3 py-3 border-t border-gray-700">
      <button
        onClick={onNewSession}
        className="w-full py-2 text-sm font-semibold text-amber-400 border border-amber-400 rounded-md hover:bg-amber-400 hover:text-gray-900 transition-colors"
      >
        + New session
      </button>
    </div>
  </div>
);

export default SessionsPanel;
```

- [ ] **Step 4: Run tests — verify they pass**

```
npm test -- --testPathPattern=SessionsPanel
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/Components/Decksmith/SessionsPanel.tsx src/Components/Decksmith/__tests__/SessionsPanel.test.tsx
git commit -m "feat: add SessionsPanel with session list and new-session button"
```

---

## Task 9: MessageList — add inline progress bubble

**Files:**
- Modify: `src/Components/Chat/MessageList.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// src/Components/Chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import { Message } from '../../types/chat';
import MessageBubble from './MessageBubble';
import GenerationProgress from '../UI_Components/GenerationProgress';

const GENERATION_STAGES = [
  { id: 'generating',           label: 'Generating deck concept' },
  { id: 'validating_commander', label: 'Validating commander' },
  { id: 'commander',            label: 'Commander confirmed' },
  { id: 'validating_cards',     label: 'Validating cards' },
  { id: 'filling',              label: 'Filling remaining slots' },
  { id: 'finalising',           label: 'Finalising deck' },
];

export interface ProgressState {
  activeStage: string | null;
  activeMessage: string;
  completedStages: string[];
  error: { stage: string; message: string } | null;
}

interface Props {
  messages: Message[];
  loading: boolean;
  progress?: ProgressState;
}

const MessageList = ({ messages, loading, progress }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4 bg-white dark:bg-gray-900">
      {messages.map(msg => (
        <MessageBubble key={msg.timestamp} message={msg} />
      ))}
      {loading && progress && (
        <div className="self-start max-w-sm bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2 border border-gray-200 dark:border-gray-700">
          <GenerationProgress
            stages={GENERATION_STAGES}
            activeStage={progress.activeStage}
            activeMessage={progress.activeMessage}
            completedStages={progress.completedStages}
            error={progress.error}
          />
        </div>
      )}
      {loading && !progress && (
        <div className="self-start bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm italic">
          Thinking…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
```

- [ ] **Step 2: Run tests**

```
npm test
```

Expected: all tests pass (MessageList has no dedicated test; the decksmithSlice and SessionsPanel tests still pass).

- [ ] **Step 3: Commit**

```bash
git add src/Components/Chat/MessageList.tsx
git commit -m "feat: add inline GenerationProgress bubble to MessageList"
```

---

## Task 10: DeckPanel — add onSave callback

**Files:**
- Modify: `src/Components/Decksmith/DeckPanel.tsx`

- [ ] **Step 1: Update the Props interface and handleSave**

In `src/Components/Decksmith/DeckPanel.tsx`, make two changes:

Change the `Props` interface at line 9 from:
```tsx
interface Props { deck: ParsedDeck | null; }
```
to:
```tsx
interface Props {
  deck: ParsedDeck | null;
  onSave?: (deckName: string) => void;
}
```

Change the component signature at line 13 from:
```tsx
const DeckPanel = ({ deck }: Props) => {
```
to:
```tsx
const DeckPanel = ({ deck, onSave }: Props) => {
```

In `handleSave`, after `setSaveStatus('success')` (around line 45), add the callback call:
```tsx
setSaveStatus('success');
onSave?.(`${deck.commander} deck`);
```

The full updated `handleSave` function:
```tsx
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
    onSave?.(`${deck.commander} deck`);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (err) {
    console.error('Failed to save deck:', err);
    setSaveStatus('error');
  }
};
```

- [ ] **Step 2: Run tests**

```
npm test
```

Expected: all tests pass (DeckPanel.test.tsx should still pass — `onSave` is optional).

- [ ] **Step 3: Commit**

```bash
git add src/Components/Decksmith/DeckPanel.tsx
git commit -m "feat: add onSave callback to DeckPanel for session title update"
```

---

## Task 11: Decksmith page redesign

**Files:**
- Modify: `src/pages/Decksmith.tsx`

- [ ] **Step 1: Replace `src/pages/Decksmith.tsx`**

```tsx
// src/pages/Decksmith.tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message } from '../types/chat';
import { buildPromptFromMessages } from '../utils/chatPrompt';
import { fetchMTGIdea, ProgressEvent } from '../services/aiService';
import MessageList, { ProgressState } from '../Components/Chat/MessageList';
import ChatInput from '../Components/Chat/ChatInput';
import DeckPanel from '../Components/Decksmith/DeckPanel';
import SessionsPanel from '../Components/Decksmith/SessionsPanel';
import {
  createSession,
  setActiveSession,
  appendMessage,
  setDeck,
  updateSessionTitle,
  selectSessions,
  selectActiveSessionId,
  selectActiveSession,
} from '../store/decksmithSlice';
import { AppDispatch } from '../store';

const Decksmith = () => {
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector(selectSessions);
  const activeSessionId = useSelector(selectActiveSessionId);
  const activeSession = useSelector(selectActiveSession);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    activeStage: null,
    activeMessage: '',
    completedStages: [],
    error: null,
  });

  const STAGE_IDS = [
    'generating',
    'validating_commander',
    'commander',
    'validating_cards',
    'filling',
    'finalising',
  ];

  useEffect(() => {
    if (!activeSessionId) {
      dispatch(createSession());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProgress = (event: ProgressEvent) => {
    const idx = STAGE_IDS.indexOf(event.stage);
    setProgress({
      activeStage: event.stage,
      activeMessage: event.message,
      completedStages: idx > 0 ? STAGE_IDS.slice(0, idx) : [],
      error: null,
    });
  };

  const handleSend = async (text: string) => {
    if (!activeSessionId) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    dispatch(appendMessage({ sessionId: activeSessionId, message: userMsg }));

    setLoading(true);
    setProgress({ activeStage: null, activeMessage: '', completedStages: [], error: null });

    try {
      const allMessages = [...(activeSession?.messages ?? []), userMsg];
      const prompt = buildPromptFromMessages(allMessages);
      const deck = await fetchMTGIdea(prompt, handleProgress);

      setProgress(prev => ({ ...prev, completedStages: STAGE_IDS, activeStage: null }));

      const aiMsg: Message = {
        role: 'assistant',
        content: deck.strategy
          ? `Here's your **${deck.commander}** deck!\n\n${deck.strategy}`
          : `Here's your **${deck.commander}** deck!`,
        timestamp: Date.now(),
      };
      dispatch(appendMessage({ sessionId: activeSessionId, message: aiMsg }));
      dispatch(setDeck({ sessionId: activeSessionId, deck }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setProgress(prev => ({
        ...prev,
        error: { stage: prev.activeStage ?? 'generating', message: errorMessage },
      }));
      dispatch(appendMessage({
        sessionId: activeSessionId,
        message: {
          role: 'assistant',
          content: `Something went wrong: ${errorMessage}`,
          timestamp: Date.now(),
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeckSaved = (deckName: string) => {
    if (activeSessionId) {
      dispatch(updateSessionTitle({ sessionId: activeSessionId, title: deckName }));
    }
  };

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
      <SessionsPanel
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => dispatch(setActiveSession(id))}
        onNewSession={() => dispatch(createSession())}
      />
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
        <MessageList
          messages={activeSession?.messages ?? []}
          loading={loading}
          progress={loading ? progress : undefined}
        />
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
      <div className="flex-shrink-0 overflow-hidden flex flex-col" style={{ width: '320px' }}>
        <DeckPanel deck={activeSession?.deck ?? null} onSave={handleDeckSaved} />
      </div>
    </div>
  );
};

export default Decksmith;
```

- [ ] **Step 2: Run tests**

```
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and verify Decksmith visually**

```
npm run dev
```

Navigate to `/decksmith`. You should see:
- Sessions panel on the left (dark, 220px) with "+ New session" button
- Chat area in the center with the message list and input
- Deck panel on the right (320px)
- No top navbar — replaced by the 48px top bar and icon sidebar

Send a message and verify the inline progress bubble appears in the chat stream as the deck is generated. After generation, verify the deck panel updates and sessions panel shows the updated session.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Decksmith.tsx
git commit -m "feat: redesign Decksmith as ChatGPT-style three-panel workspace"
```

---

## Task 12: Final cleanup and full test run

- [ ] **Step 1: Run the full test suite**

```
npm test
```

Expected: all tests pass with 0 failures. Coverage report is generated in `coverage/`.

- [ ] **Step 2: TypeScript type-check**

```
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A
git status
# verify only expected files are staged
git commit -m "feat: Phase 2a complete — AppLayout shell + Decksmith ChatGPT redesign"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Top bar 48px: Task 4 (TopBar) + Task 6 (AppLayout)
- ✅ Sidebar 64px icon-only: Task 5 (Sidebar)
- ✅ Theme dark/light: TopBar reuses useTheme; Tailwind `dark:` classes throughout
- ✅ Sessions panel 220px: Task 8 (SessionsPanel)
- ✅ Chat area + inline progress: Task 9 (MessageList) + Task 11 (Decksmith)
- ✅ Deck panel 320px: Task 11 (Decksmith, `style={{ width: '320px' }}`)
- ✅ Redux slice with localStorage: Tasks 1–3
- ✅ AppLayout wraps all routes, Navbar removed: Tasks 6–7
- ✅ DeckPanel onSave updates session title: Task 10

**Type consistency check:**
- `ProgressState` interface exported from `MessageList.tsx`, imported in `Decksmith.tsx` ✅
- `DecksmithSession` / `DecksmithState` exported from `decksmithSlice.ts`, used in `SessionsPanel.tsx` and `Decksmith.tsx` ✅
- `AppDispatch` imported from `../store` in `Decksmith.tsx` ✅
- `onSave?: (deckName: string) => void` added to DeckPanel Props, called with `${deck.commander} deck` ✅
