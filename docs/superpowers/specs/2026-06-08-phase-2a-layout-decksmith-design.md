# Phase 2a — Shared Layout + Decksmith Redesign

## Overview

Replace the current fixed top navbar with a persistent top bar + icon sidebar shell, then redesign the Decksmith page into a ChatGPT-style workspace: sessions history panel, chat area, and live deck panel side by side.

This is Phase 2a of the Commander Hut UX overhaul. Phase 2b (Deck detail visual grid + Card browsing) follows independently once this ships.

---

## 1. Layout & Navigation

### What changes

The current `Navbar.tsx` (72px fixed top bar with all nav links) is removed and replaced with two persistent shell elements rendered by a new `AppLayout` component:

**Top bar (48px, full width)**
- Left: brand logo + "CommanderHut" wordmark
- Right: theme toggle (sun/moon icon), user avatar button (opens dropdown with Profile + Logout)
- No navigation links — global controls only

**Left sidebar (64px, icon-only)**
- Stacked icon buttons, each linking to a top-level section
- Nav items (in order): Decksmith 🤖, My Decks 🃏, Cards 🔍, Sandbox ⚡
- Profile 👤 pinned to the bottom
- Active item gets a highlighted background (gold in dark mode, blue in light mode)
- Hover tooltip shows the section label (using `title` attribute or a small popover)
- No expanded/text-label mode — keeps the sidebar narrow and unobtrusive

**Content area**
- Full height minus 48px (top bar), full width minus 64px (sidebar)
- All existing pages remove their `pt-[72px]` offset and render inside `AppLayout`

### Theme

Two colour modes, both supported with Tailwind `dark:` classes:

| | Dark mode | Light mode |
|---|---|---|
| Top bar bg | `gray-900` | `white` with bottom border |
| Sidebar bg | `gray-800` | `gray-800` (sidebar stays dark in both modes) |
| Sidebar active | gold `#d4a843` highlight | blue `#2563eb` highlight |
| Content bg | `gray-950` | `gray-50` |
| Cards/panels | `gray-800` | `white` with `gray-200` border |
| Primary accent | `#d4a843` (amber/gold) | `#2563eb` (blue) |
| Text primary | `gray-100` | `gray-900` |
| Text secondary | `gray-400` | `gray-500` |

### New component: `AppLayout`

```tsx
// src/Components/Layout/AppLayout.tsx
// Renders TopBar + Sidebar + children in content area.
// All protected routes render inside this wrapper.
```

`App.tsx` (or the router) wraps all authenticated routes in `<AppLayout>`. Public routes (login, register, `/sandbox`) may render without the sidebar at the author's discretion.

---

## 2. Decksmith Redesign

### Concept

"ChatGPT for Commander decks" — the Decksmith page is a persistent workspace with three panels:

```
┌──────────────────────────────────────────────────────┐
│ TopBar (48px)                                        │
├────┬──────────────┬──────────────────┬───────────────┤
│    │ Sessions     │ Chat area        │ Deck panel    │
│    │ panel        │ (flex)           │ (320px)       │
│ S  │ (220px)      │                  │               │
│ i  │              │  message list    │  commander    │
│ d  │  session 1 ← │                  │  card list    │
│ e  │  session 2   │  [progress       │  role badges  │
│ b  │  session 3   │   inline]        │               │
│ a  │              │                  │  [Save Deck]  │
│ r  │  + New       │  [chat input]    │               │
└────┴──────────────┴──────────────────┴───────────────┘
```

### Sessions panel (220px)

- Lists all sessions for the current user, newest first
- Each row: deck name (or "New session") + relative date
- Active session highlighted with left border accent
- "New session" button pinned to the bottom — clears active session, starts fresh chat
- Clicking a past session loads its messages and deck into the chat and deck panel
- Sessions are frontend-only (no new backend endpoint) — stored in Redux + localStorage

### Chat area

- `MessageList` and `ChatInput` components remain, now scoped to the active session
- `GenerationProgress` moves inline: progress stages appear as a special assistant message bubble inside the chat stream rather than in a separate side panel
- After generation completes, the deck summary (commander name + strategy) appears as a final assistant message card
- The right-side deck panel updates in real time as the SSE stream arrives

### Deck panel (320px)

- Shows the active session's generated deck: commander image, name, strategy blurb, card list with role badges
- Collapses to a narrow placeholder ("Generate a deck to see it here") when the session has no deck yet
- Save button: saves to backend, updates session title, shows link to Deck Detail page
- Panel is read-only — editing happens on the Deck Detail page

### Generation progress (inline)

The six pipeline stages (`generating`, `validating_commander`, `commander`, `validating_cards`, `filling`, `finalising`) render inside a collapsible assistant bubble in the chat:

- Pending: grey circle
- Active: blue spinner + stage message
- Complete: green checkmark
- Error: red ✕ + error message

On completion the bubble collapses to a one-line summary ("Deck built in 12s — 20 signature cards validated").

---

## 3. State Management

### New slice: `decksmithSlice`

```ts
// src/store/decksmithSlice.ts

interface DecksmithSession {
  id: string;               // uuid
  title: string;            // deck name or "New session"
  messages: Message[];      // chat history
  deck: ParsedDeck | null;  // generated deck, null until first generation
  createdAt: string;        // ISO timestamp
}

interface DecksmithState {
  sessions: DecksmithSession[];
  activeSessionId: string | null;
}
```

Actions:
- `createSession()` — generates new session with uuid, sets as active
- `setActiveSession(id)` — switches active session
- `appendMessage(sessionId, message)` — adds a message to session
- `setDeck(sessionId, deck)` — stores generated deck on session
- `updateSessionTitle(sessionId, title)` — called after deck save

Persisted to `localStorage` manually — `redux-persist` is not in the project and adding it is unnecessary overhead. The slice loads initial state from `localStorage` in its initializer function, and `store.subscribe()` in `src/store/index.ts` writes the serialised `decksmith` key on every state change.

### Decksmith.tsx changes

All local state (`messages`, `loading`, `activeStage`, `activeMessage`, `completedStages`, `progressError`, `deck`) moves out of component state into the Redux slice. The component becomes a thin connector:

- Reads `sessions` and `activeSessionId` from Redux
- Dispatches `appendMessage` and `setDeck` during SSE streaming
- Passes `onProgress` callback to `aiService.fetchMTGIdea` as before

---

## 4. Components

### New files

| File | Responsibility |
|------|----------------|
| `src/Components/Layout/AppLayout.tsx` | Shell wrapper: TopBar + Sidebar + content slot |
| `src/Components/Layout/TopBar.tsx` | 48px top bar: brand, theme toggle, user menu |
| `src/Components/Layout/Sidebar.tsx` | 64px icon sidebar with active state + tooltips |
| `src/Components/Decksmith/SessionsPanel.tsx` | Session list + "New session" button |
| `src/store/decksmithSlice.ts` | Redux slice for session state |

### Modified files

| File | Change |
|------|--------|
| `src/pages/Decksmith.tsx` | 3-column layout, Redux-driven state, inline progress |
| `src/App.tsx` | Wrap protected routes in `<AppLayout>` |
| `src/pages/DeckPage.tsx` | Remove `pt-[72px]`, render inside AppLayout |
| `src/pages/DeckDetailPage.tsx` | Remove `pt-[72px]`, render inside AppLayout |
| `src/pages/Sandbox.tsx` | Remove navbar offset, render inside AppLayout |
| `src/pages/EditDeck.tsx` | Remove navbar offset, render inside AppLayout |
| `src/Components/UI_Components/GenerationProgress.tsx` | Adapt to inline chat bubble display |
| `src/store/index.ts` | Add `decksmith` reducer; add `store.subscribe()` for localStorage persistence |

### Removed

| File | Reason |
|------|--------|
| `src/Components/Navbar.tsx` | Replaced by AppLayout / TopBar / Sidebar |

---

## 5. Out of Scope (Phase 2b)

- Deck detail visual card image grid
- Card browsing / search page
- Any backend changes (no new API endpoints)
