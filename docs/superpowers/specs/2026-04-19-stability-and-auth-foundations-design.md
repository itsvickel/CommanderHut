# Stability & Auth Foundations — Design

**Date:** 2026-04-19
**Branch context:** `profile-page`
**Status:** Approved design, ready for implementation planning.

## Context & Motivation

CommanderHut currently has several issues that make the app feel unstable or broken:

- Protected pages (`/profile`, `/decks`, `/decks/:id`, `/sandbox`, `/decksmith`) are reachable while logged out.
- A thrown error in any page white-screens the entire app.
- `useAuth` has no dependency array and refetches `/api/me` on every component mount.
- There is a reload race between sessionStorage and Redux on cold loads.
- Loading states are literal `"Loading..."` strings; service errors are silently `console.log`-ed.
- The Navbar renders empty-string nav entries when logged in, leaving broken-looking gaps.

This spec addresses all of the above as a single "stability & auth foundations" workstream. Other identified improvement areas (data layer, design system, testing infrastructure) are intentionally deferred to their own brainstorm → spec → plan cycles.

## Goals

1. Protected routes require authentication and redirect unauthenticated users to `/login`, preserving the original URL so they land back after sign-in.
2. No page-level crash takes down the app shell; users can always navigate away.
3. Auth initialization runs once per session, with no per-mount refetches and no reload race.
4. Replace ad-hoc loading/error strings in the main data-fetching pages with shared, accessible UI primitives.
5. The Navbar reflects auth state cleanly: Login/Register when signed out, Logout when signed in. No empty-string gaps.

## Non-Goals

To keep scope tight and reviewable:

- No new data-layer abstraction (typed API client, RTK Query, fetch/axios consolidation) — separate workstream.
- No design tokens, theme provider, or styling refactor — separate workstream.
- No coverage thresholds, CI changes, or backfill of tests for untouched pages — separate workstream.
- No new `<EmptyState>` primitive or page-specific skeleton components.
- No dropdown/user menu in the Navbar (just plain Login/Logout links).
- No changes to the Redux store shape beyond `AuthSlice`.

## Approach

A single Redux-based auth status model drives two small wrapper components (`<RequireAuth>`, `<PageBoundary>`) that wrap each route, plus two shared UI primitives (`<Spinner>`, `<ErrorState>`) that replace inline loading/error strings. Minimal new abstractions; matches existing React + Redux + styled-components idioms.

## Design

### 1. Auth state model & initialization

#### `AuthSlice` changes — `src/store/AuthSlice.tsx`

State shape:

```ts
{
  status: 'idle' | 'checking' | 'authenticated' | 'unauthenticated',
  user: User | null,
}
```

Actions:

- `authCheckStarted` → `status: 'checking'`.
- `authCheckSucceeded(user)` → `status: 'authenticated'`, `user`. Also writes `user` to `sessionStorage`.
- `authCheckFailed` → `status: 'unauthenticated'`, `user: null`. Clears `sessionStorage`.
- `logoutLocal` → `status: 'unauthenticated'`, `user: null`. Clears `sessionStorage`.

Selectors:

- `selectAuthStatus(state)` → `status`.
- `selectIsAuthenticated(state)` → `status === 'authenticated'` (compatibility shim for any existing `state.auth.isAuthenticated` reads).
- `selectCurrentUser(state)` → `user`.

#### `useAuth` rewrite — `src/hooks/useAuth.ts`

Behavior (algorithm, in order, inside a single `useEffect` with `[]` deps):

1. Read cached user from `sessionStorage`.
2. If cached user exists → dispatch `authCheckSucceeded(cachedUser)` (status becomes `'authenticated'`; no "checking" flash on reload).
   Else → dispatch `authCheckStarted` (status becomes `'checking'`).
3. Kick off `GET /api/me` with an `AbortController`.
4. On 2xx → dispatch `authCheckSucceeded(freshUser)`.
5. On non-2xx or network error (not an abort) → dispatch `authCheckFailed`.
6. Cleanup: call `controller.abort()` on unmount; abort errors are ignored (they aren't real failures).

Runs exactly once per `AppComponent` mount. Note that React Strict Mode in development mounts twice; the first mount's fetch is aborted by its cleanup and the second mount's fetch completes — behaviorally still one completed request.

`App.tsx` must stop running its own `useEffect` that reads `sessionStorage` and dispatches `login` — `useAuth` now owns auth initialization.

### 2. Route guard & error boundary

#### `<RequireAuth>` — new file `src/Components/Auth/RequireAuth.tsx`

Behavior:

- Reads `auth.status` from Redux.
- `'checking'` or `'idle'` → renders `<Spinner />` (page-level, centered in the content area; the Navbar stays visible because `<RequireAuth>` wraps the route element, not the app shell).
- `'unauthenticated'` → `<Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />`.
- `'authenticated'` → renders `children`.

Protected routes (wrapped with `<RequireAuth>`): `/profile`, `/decks`, `/decks/:id`, `/sandbox`, `/decksmith`.

Public routes (not wrapped): `/`, `/cards`, `/login`, `/register`.

#### `<PageBoundary>` — new file `src/Components/UI_Components/PageBoundary.tsx`

A class-based React error boundary implementing `componentDidCatch` and `getDerivedStateFromError`.

Behavior:

- No error → renders children unchanged.
- Error caught → renders `<ErrorState message="Something went wrong on this page." retry={this.handleReset} />`, where `handleReset` resets internal `hasError` state so the next render re-mounts children.
- Logs the error to `console.error` for now. Accepts an optional `onReset` prop for callers that want to re-run a fetch on retry — not required for v1.

Every `<Route>`'s `element` is wrapped with `<PageBoundary>`. The outermost layout (`MainWrapper` + `Navbar`) lives outside the boundary, so a crashed page keeps the app shell and the Navbar remains usable.

Example composition in `App.tsx`:

```tsx
<Route
  path="/profile"
  element={
    <PageBoundary>
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    </PageBoundary>
  }
/>
```

### 3. UI primitives

#### `<Spinner />` — new file `src/Components/UI_Components/Spinner.tsx`

- Presentational styled-component with a CSS keyframe rotation.
- Props: `size?: 'sm' | 'md' | 'lg'` (default `md`), `label?: string` (default `"Loading"`, rendered in a visually-hidden span for screen readers).
- Wrapper has `role="status"` and `aria-live="polite"`.
- Centers itself in its container.

Consumers: `<RequireAuth>` (while checking), `CardPage`, `DeckPage`, `AIGenerate`.

#### `<ErrorState />` — new file `src/Components/UI_Components/ErrorState.tsx`

- Props: `message: string`, `retry?: () => void`.
- Renders a short heading ("Something went wrong"), the `message`, and a "Try again" button when `retry` is provided.
- Uses existing `colors` from `src/styles/colors` to stay consistent with current styling. No new tokens.

Consumers: `<PageBoundary>` and pages that surface service failures.

#### Page integration pattern

Apply in `CardPage`, `DeckPage`, `AIGenerate`:

```tsx
if (loading) return <Spinner />;
if (error) return <ErrorState message={error} retry={refetch} />;
return <ActualContent />;
```

Each page's existing `catch` blocks stop silently `console.log`-ing and start populating a local `error` state string that drives `<ErrorState>`.

### 4. Navbar, Login redirect, Logout

#### `Navbar` — `src/Components/Navbar.tsx`

Stop constructing `navigationObj` with empty-string names in `App.tsx`. The Navbar reads `auth.status` and `auth.user` directly.

Link visibility:

- Always visible: `Cards` (public).
- Visible only when authenticated: `Decks`, `Sandbox`, `AI Decksmith`, `Profile`. These would redirect to `/login` anyway; hiding them prevents noisy UX.
- Right-hand side:
  - `unauthenticated` → `Login`, `Register`.
  - `authenticated` → `Logout` button.
  - `checking` or `idle` → render nothing on the right (avoid flicker on first paint).

Logout behavior:

- Dispatch `logoutLocal` (clears Redux + sessionStorage synchronously).
- Call `logoutUser()` from `userService` fire-and-forget; errors are `console.error`-ed but do not block the UI.
- `navigate('/')`.

#### `Login` — `src/pages/Login.tsx`

On successful login:

1. Dispatch `authCheckSucceeded(user)` so Redux updates immediately (no wait for `/api/me` round-trip).
2. Read `?redirect=` from `location.search`. If present **and** it starts with `/` (guard against open-redirect attacks), `navigate(redirect, { replace: true })`. Otherwise `navigate('/', { replace: true })`.

#### `RegisterUser` — `src/pages/RegisterUser.tsx`

Same redirect handling as `Login` on successful registration.

### 5. Testing

New tests added alongside the new code:

- `src/store/__tests__/AuthSlice.test.ts` — reducer transitions for each action; `logoutLocal` clears sessionStorage.
- `src/Components/Auth/__tests__/RequireAuth.test.tsx` — renders `<Spinner>` while checking; renders `<Navigate>` to `/login?redirect=...` when unauthenticated; renders children when authenticated.
- `src/Components/UI_Components/__tests__/PageBoundary.test.tsx` — renders children normally; renders `<ErrorState>` with retry when a child throws; retry resets and re-renders children.
- `src/Components/UI_Components/__tests__/Spinner.test.tsx` — renders with correct `role="status"` and the visually-hidden label.
- `src/Components/UI_Components/__tests__/ErrorState.test.tsx` — renders message; shows "Try again" only when `retry` is provided; clicking it invokes callback.
- `src/hooks/__tests__/useAuth.test.ts` — optimistic hydrate from sessionStorage; `/api/me` success dispatches `authCheckSucceeded`; `/api/me` failure dispatches `authCheckFailed` and clears sessionStorage; abort on unmount.

We do **not** add tests to `CardPage`, `DeckPage`, or `AIGenerate` here; we manually verify their loading/error swaps didn't regress. Backfilling page and service tests is part of workstream D.

## File Inventory

**New files:**

- `src/Components/Auth/RequireAuth.tsx`
- `src/Components/UI_Components/PageBoundary.tsx`
- `src/Components/UI_Components/Spinner.tsx`
- `src/Components/UI_Components/ErrorState.tsx`
- `src/store/__tests__/AuthSlice.test.ts`
- `src/Components/Auth/__tests__/RequireAuth.test.tsx`
- `src/Components/UI_Components/__tests__/PageBoundary.test.tsx`
- `src/Components/UI_Components/__tests__/Spinner.test.tsx`
- `src/Components/UI_Components/__tests__/ErrorState.test.tsx`
- `src/hooks/__tests__/useAuth.test.ts`

**Edited files:**

- `src/store/AuthSlice.tsx` — new status enum, new actions, selectors.
- `src/hooks/useAuth.ts` — one-shot initializer, optimistic hydrate, AbortController.
- `src/App.tsx` — wrap routes with `<PageBoundary>` and (for protected routes) `<RequireAuth>`; remove the sessionStorage `useEffect`; stop passing `navigationObj` with empty-string names.
- `src/Components/Navbar.tsx` — read auth from Redux directly; conditional nav and Logout.
- `src/pages/Login.tsx` — honor `?redirect=` param; dispatch `authCheckSucceeded` on success.
- `src/pages/RegisterUser.tsx` — honor `?redirect=` param on success.
- `src/pages/CardPage.tsx` — use `<Spinner>` / `<ErrorState>` instead of string literals; surface `catch` errors into local state.
- `src/pages/DeckPage.tsx` — same pattern.
- `src/pages/AIGenerate.tsx` — same pattern.

## Acceptance Criteria

1. Visiting `/profile` while logged out redirects to `/login?redirect=%2Fprofile`; logging in lands back on `/profile`.
2. Same for `/decks`, `/decks/:id`, `/sandbox`, `/decksmith`.
3. Throwing an error from within any page renders the `ErrorState` fallback with a working retry, and the Navbar remains interactive.
4. A fresh page reload does not show a flash of `/login` on protected pages when the sessionStorage user is present.
5. `useAuth` fires exactly one completed `/api/me` request per cold load in production (verified via network panel / test). In dev, React Strict Mode may show two fetches; the first is aborted by cleanup.
6. Navbar shows only the correct links for the current auth state; no empty-string gaps.
7. Logging out from any page lands on `/` and clears Redux + sessionStorage.
8. `CardPage`, `DeckPage`, `AIGenerate` show `<Spinner>` while loading and `<ErrorState>` with a retry when the underlying fetch fails.
9. All new unit tests pass; existing tests continue to pass.
