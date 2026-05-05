# Deck Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/decks` to show only the logged-in user's own decks, and create a new `/decks/:id` detail page with a Moxfield-style column layout and inline editing (rename, add card per column, remove card, save via PATCH, delete).

**Architecture:** The backend already has all required endpoints (`PATCH /decks/:id`, `DELETE /decks/:id`, `GET /decks/user/:user_id`, `GET /decks/:id`). Frontend work only: update the service layer, rewrite `DeckPage.tsx`, create `DeckDetailPage.tsx`, and adjust routing in `App.tsx`. New pages use Tailwind (Plan 1 prerequisite runs first).

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Redux Toolkit (`selectCurrentUser`), React Router v6, Jest + React Testing Library, axios/fetch

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/services/deckService.ts` | Fix `fetchDeckListByName(userId)`, add `updateDeck`, add `deleteDeck` |
| Modify | `src/pages/DeckPage.tsx` | User's own deck list (auth-gated via RequireAuth in routing) |
| Create | `src/pages/__tests__/DeckPage.test.tsx` | DeckPage unit tests |
| Create | `src/pages/DeckDetailPage.tsx` | Column layout + inline editing |
| Create | `src/pages/__tests__/DeckDetailPage.test.tsx` | DeckDetailPage unit tests |
| Modify | `src/App.tsx` | `/sandbox` → publicRoute, `/decks/:id` → publicRoute(DeckDetailPage) |

---

### Task 1: Update `deckService.ts`

Fix `fetchDeckListByName` to accept a `userId` parameter (it currently ignores user ID), and add `updateDeck` and `deleteDeck`.

**Files:**
- Modify: `src/services/deckService.ts`

- [ ] **Step 1: Update the service**

Replace the three functions in `src/services/deckService.ts`. Keep `postDeckList` and `fetchAllDecks` untouched above them.

```ts
// Replace the existing fetchDeckListByName and fetchDeckListByID:

export const fetchDeckListByName = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_ENDPOINT.DECK_BY_USER}/${userId}`);
    if (!response || !response.data) throw new Error('Failed to fetch user decklist');
    return response.data;
  } catch (error) {
    console.error('Error fetching user deck list:', error);
    throw error;
  }
};

export const fetchDeckListByID = async (id: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_ENDPOINT.DECK_BY_ID}${id}`);
    if (!response || !response.data) throw new Error('Failed to fetch deck');
    return response.data;
  } catch (error) {
    console.error('Error fetching deck by ID:', error);
    throw error;
  }
};

export const updateDeck = async (
  id: string,
  payload: { name?: string; cards?: { name: string; quantity: number }[] }
): Promise<any> => {
  try {
    const response = await fetch(`${API_ENDPOINT.DECK_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'Failed to update deck');
      (error as any).details = result;
      throw error;
    }
    return result;
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
};

export const deleteDeck = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_ENDPOINT.DECK_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete deck');
    }
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/deckService.ts
git commit -m "feat: add updateDeck/deleteDeck to deckService, fix fetchDeckListByName userId param"
```

---

### Task 2: Rewrite `DeckPage.tsx` (TDD)

`DeckPage` shows the logged-in user's own decks. It reads `user.id` from Redux and passes it to `fetchDeckListByName`. Empty state links to `/sandbox`. No auth redirect needed here — `RequireAuth` in routing handles that.

**Files:**
- Modify: `src/pages/DeckPage.tsx`
- Create: `src/pages/__tests__/DeckPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/__tests__/DeckPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/AuthSlice';
import DeckPage from '../DeckPage';
import { fetchDeckListByName } from '../../services/deckService';

jest.mock('../../services/deckService', () => ({
  fetchDeckListByName: jest.fn(),
}));

const user = { id: 'user1', username: 'alice', email_address: 'alice@test.com' };

const buildStore = (authUser: any = user) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { status: 'authenticated' as const, user: authUser },
    },
  });

const renderPage = (authUser: any = user) =>
  render(
    <Provider store={buildStore(authUser)}>
      <MemoryRouter>
        <DeckPage />
      </MemoryRouter>
    </Provider>
  );

beforeEach(() => jest.clearAllMocks());

describe('DeckPage', () => {
  it('shows loading spinner on mount', () => {
    (fetchDeckListByName as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state with link to /sandbox when no decks', async () => {
    (fetchDeckListByName as jest.Mock).mockResolvedValue([]);
    renderPage();
    await screen.findByText(/no decks yet/i);
    const link = screen.getByRole('link', { name: /sandbox/i });
    expect(link).toHaveAttribute('href', '/sandbox');
  });

  it('renders deck cards with name and format', async () => {
    (fetchDeckListByName as jest.Mock).mockResolvedValue([
      {
        _id: 'deck1',
        deck_name: 'My Commander Deck',
        format: 'Commander',
        commander_image: '',
        updated_at: '2026-01-15T00:00:00.000Z',
      },
    ]);
    renderPage();
    await screen.findByText('My Commander Deck');
    expect(screen.getByText('Commander')).toBeInTheDocument();
  });

  it('calls fetchDeckListByName with the logged-in user id', async () => {
    (fetchDeckListByName as jest.Mock).mockResolvedValue([]);
    renderPage();
    await screen.findByText(/no decks yet/i);
    expect(fetchDeckListByName).toHaveBeenCalledWith('user1');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/pages/__tests__/DeckPage.test.tsx --no-coverage
```

Expected: 4 failures (DeckPage doesn't call `fetchDeckListByName` with userId yet)

- [ ] **Step 3: Rewrite `DeckPage.tsx`**

Fully replace `src/pages/DeckPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchDeckListByName } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const DeckPage = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDeckListByName(user.id);
      setDecks(res ?? []);
    } catch {
      setError('Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner label="Loading decks" />;
  if (error) return <ErrorState message={error} retry={load} />;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      <h2 className="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">
        Your Decks
      </h2>

      {decks.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          No decks yet —{' '}
          <Link to="/sandbox" className="text-blue-600 dark:text-blue-400 underline">
            create one in Sandbox
          </Link>
        </p>
      ) : (
        <div className="grid gap-8 overflow-y-auto max-h-[70vh]"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {decks.map((item) => (
            <div
              key={item._id}
              onClick={() => navigate(`/decks/${item._id}`)}
              className="flex flex-col cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
            >
              <img
                src={item.commander_image || '/images/placeholder_commander.png'}
                alt={`${item.deck_name} Commander`}
                className="w-40 h-56 object-cover rounded-xl mx-auto mt-4"
              />
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-xl font-bold truncate text-gray-900 dark:text-gray-100 mb-2">
                  {item.deck_name}
                </h3>
                <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded mb-2 self-start">
                  {item.format}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                  Updated {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckPage;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/pages/__tests__/DeckPage.test.tsx --no-coverage
```

Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add src/pages/DeckPage.tsx src/pages/__tests__/DeckPage.test.tsx
git commit -m "feat: rewrite DeckPage to show user's own decks from Redux user id"
```

---

### Task 3: Create `DeckDetailPage.tsx` (TDD)

Column layout grouped by MTG card type. Owner sees inline editing: rename deck name, add card per column, remove card with ×. Save button commits changes via `PATCH /decks/:id`. Delete button with `confirm()` dialog then redirects to `/decks`.

**Files:**
- Create: `src/pages/DeckDetailPage.tsx`
- Create: `src/pages/__tests__/DeckDetailPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/__tests__/DeckDetailPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer from '../../store/AuthSlice';
import DeckDetailPage from '../DeckDetailPage';
import { fetchDeckListByID, updateDeck, deleteDeck } from '../../services/deckService';

jest.mock('../../services/deckService', () => ({
  fetchDeckListByID: jest.fn(),
  updateDeck: jest.fn(),
  deleteDeck: jest.fn(),
}));

const ownerUser = { id: 'user1', username: 'alice', email_address: 'alice@test.com' };
const otherUser = { id: 'user2', username: 'bob', email_address: 'bob@test.com' };

const buildStore = (user: any = null) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { status: user ? 'authenticated' as const : 'unauthenticated' as const, user },
    },
  });

const deckFixture = {
  _id: 'deck123',
  deck_name: 'My Test Deck',
  owner: 'user1',
  format: 'Commander',
  commander: "Atraxa, Praetors' Voice",
  cards: [
    {
      card: {
        name: "Atraxa, Praetors' Voice",
        type_line: 'Legendary Creature — Phyrexian Angel Horror',
        image_uris: { normal: 'http://img/atraxa.jpg' },
      },
      quantity: 1,
    },
    {
      card: {
        name: 'Sol Ring',
        type_line: 'Artifact',
        image_uris: { normal: 'http://img/sol.jpg' },
      },
      quantity: 1,
    },
    {
      card: {
        name: 'Swords to Plowshares',
        type_line: 'Instant',
        image_uris: { normal: 'http://img/swords.jpg' },
      },
      quantity: 1,
    },
  ],
};

const renderPage = (user: any = ownerUser) =>
  render(
    <Provider store={buildStore(user)}>
      <MemoryRouter initialEntries={['/decks/deck123']}>
        <Routes>
          <Route path="/decks/:id" element={<DeckDetailPage />} />
          <Route path="/decks" element={<div data-testid="decks-page">Decks</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  (fetchDeckListByID as jest.Mock).mockResolvedValue({ ...deckFixture });
});

describe('DeckDetailPage', () => {
  it('renders cards in correct type columns', async () => {
    renderPage();
    await screen.findByText('My Test Deck');
    expect(screen.getByText(/Commander \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Artifact \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Instant \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Atraxa, Praetors' Voice")).toBeInTheDocument();
    expect(screen.getByText('Sol Ring')).toBeInTheDocument();
    expect(screen.getByText('Swords to Plowshares')).toBeInTheDocument();
  });

  it('hides edit controls for non-owners', async () => {
    renderPage(otherUser);
    await screen.findByText('My Test Deck');
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('enables Save button when deck name is changed', async () => {
    renderPage();
    const input = await screen.findByLabelText('Deck name');
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    fireEvent.change(input, { target: { value: 'Renamed Deck' } });
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('removes card from its column when × is clicked, enables Save', async () => {
    renderPage();
    await screen.findByText('Sol Ring');
    fireEvent.click(screen.getByLabelText('Remove Sol Ring'));
    expect(screen.queryByText('Sol Ring')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('calls updateDeck with correct payload on Save', async () => {
    (updateDeck as jest.Mock).mockResolvedValue({
      ...deckFixture,
      deck_name: 'Renamed Deck',
    });
    renderPage();
    const input = await screen.findByLabelText('Deck name');
    fireEvent.change(input, { target: { value: 'Renamed Deck' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(updateDeck).toHaveBeenCalledWith('deck123', {
        name: 'Renamed Deck',
        cards: expect.arrayContaining([
          { name: "Atraxa, Praetors' Voice", quantity: 1 },
          { name: 'Sol Ring', quantity: 1 },
          { name: 'Swords to Plowshares', quantity: 1 },
        ]),
      })
    );
  });

  it('shows error and preserves edits when Save fails', async () => {
    (updateDeck as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderPage();
    const input = await screen.findByLabelText('Deck name');
    fireEvent.change(input, { target: { value: 'Renamed Deck' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await screen.findByText('Network error');
    expect(screen.getByLabelText('Deck name')).toHaveValue('Renamed Deck');
  });

  it('navigates to /decks after successful delete', async () => {
    (deleteDeck as jest.Mock).mockResolvedValue(undefined);
    window.confirm = jest.fn().mockReturnValue(true);
    renderPage();
    await screen.findByText('My Test Deck');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await screen.findByTestId('decks-page');
    expect(deleteDeck).toHaveBeenCalledWith('deck123');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/pages/__tests__/DeckDetailPage.test.tsx --no-coverage
```

Expected: 7 failures (file doesn't exist yet)

- [ ] **Step 3: Create `src/pages/DeckDetailPage.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchDeckListByID, updateDeck, deleteDeck } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const ORDERED_TYPES = [
  'Commander', 'Creature', 'Instant', 'Sorcery',
  'Enchantment', 'Artifact', 'Planeswalker', 'Land',
];

function getColumnType(cardName: string, commanderName: string, typeLine: string): string {
  if (cardName === commanderName) return 'Commander';
  const supertype = (typeLine ?? '').split(' — ')[0];
  for (const t of ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land']) {
    if (supertype.includes(t)) return t;
  }
  return 'Other';
}

interface DisplayCard {
  name: string;
  quantity: number;
  imageUri: string;
}

const DeckDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pending edit state
  const [pendingName, setPendingName] = useState('');
  const [removedNames, setRemovedNames] = useState<Set<string>>(new Set());
  const [addedByColumn, setAddedByColumn] = useState<Record<string, string[]>>({});
  const [addInputs, setAddInputs] = useState<Record<string, string>>({});

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unknownCards, setUnknownCards] = useState<string[]>([]);

  // Hover tooltip
  const [hoveredCard, setHoveredCard] = useState<{ name: string; imageUri: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const loadDeck = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchDeckListByID(id);
      setDeck(data);
      setPendingName(data.deck_name ?? '');
    } catch {
      setFetchError('Failed to load deck.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDeck(); }, [loadDeck]);

  const isOwner = !!(user && deck && user.id === deck.owner);

  const isDirty = !!deck && (
    pendingName !== deck.deck_name ||
    removedNames.size > 0 ||
    Object.values(addedByColumn).some((a) => a.length > 0)
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const groupedCards = useMemo((): Record<string, DisplayCard[]> => {
    if (!deck) return {};
    const groups: Record<string, DisplayCard[]> = {};
    for (const { card, quantity } of deck.cards ?? []) {
      if (removedNames.has(card.name)) continue;
      const col = getColumnType(card.name, deck.commander, card.type_line ?? '');
      if (!groups[col]) groups[col] = [];
      groups[col].push({
        name: card.name,
        quantity,
        imageUri: card.image_uris?.normal ?? card.image_uris?.small ?? '',
      });
    }
    return groups;
  }, [deck, removedNames]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    setUnknownCards([]);
    const cards = [
      ...(deck.cards ?? [])
        .filter(({ card }: any) => !removedNames.has(card.name))
        .map(({ card, quantity }: any) => ({ name: card.name, quantity })),
      ...Object.values(addedByColumn)
        .flat()
        .map((name: string) => ({ name, quantity: 1 })),
    ];
    try {
      const updated = await updateDeck(id, { name: pendingName, cards });
      setDeck(updated);
      setPendingName(updated.deck_name ?? '');
      setRemovedNames(new Set());
      setAddedByColumn({});
    } catch (err: any) {
      setSaveError(err.message || 'Save failed.');
      if (err.details?.unknownCards) setUnknownCards(err.details.unknownCards);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this deck? This cannot be undone.')) return;
    try {
      await deleteDeck(id!);
      navigate('/decks');
    } catch {
      setSaveError('Delete failed. Please try again.');
    }
  };

  const handleAddCard = (col: string) => {
    const name = (addInputs[col] ?? '').trim();
    if (!name) return;
    setAddedByColumn((prev) => ({ ...prev, [col]: [...(prev[col] ?? []), name] }));
    setAddInputs((prev) => ({ ...prev, [col]: '' }));
  };

  if (loading) return <Spinner label="Loading deck" />;
  if (fetchError) return <ErrorState message={fetchError} retry={loadDeck} />;
  if (!deck) return null;

  const totalCards = (deck.cards ?? []).reduce(
    (sum: number, { quantity }: any) => sum + quantity, 0
  );

  const nonStandardCols = Object.keys(groupedCards).filter(
    (k) => !ORDERED_TYPES.includes(k)
  );
  const allColumns = isOwner
    ? [...ORDERED_TYPES, ...nonStandardCols]
    : [...ORDERED_TYPES, ...nonStandardCols].filter(
        (col) =>
          (groupedCards[col]?.length ?? 0) > 0 ||
          (addedByColumn[col]?.length ?? 0) > 0
      );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {/* Header */}
      <div className="max-w-screen-xl mx-auto mb-6 flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0">
          {isOwner ? (
            <input
              aria-label="Deck name"
              className="text-3xl font-bold bg-transparent border-b border-gray-400 dark:border-gray-600 focus:outline-none w-full"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
            />
          ) : (
            <h1 className="text-3xl font-bold truncate">{deck.deck_name}</h1>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {deck.format} · {totalCards} cards
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-3 items-start flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded disabled:opacity-40 hover:bg-blue-700"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Save errors */}
      {saveError && (
        <p className="text-red-500 text-sm mb-4 max-w-screen-xl mx-auto">{saveError}</p>
      )}
      {unknownCards.length > 0 && (
        <ul className="text-red-500 text-sm mb-4 max-w-screen-xl mx-auto list-disc pl-4">
          {unknownCards.map((n) => (
            <li key={n}>Unknown card: {n}</li>
          ))}
        </ul>
      )}

      {/* Column grid */}
      <div className="max-w-screen-xl mx-auto flex gap-4 overflow-x-auto pb-4 items-start">
        {allColumns.map((col) => {
          const cards = groupedCards[col] ?? [];
          const added = addedByColumn[col] ?? [];
          const total = cards.reduce((s, c) => s + c.quantity, 0) + added.length;
          if (!isOwner && total === 0) return null;

          return (
            <div key={col} className="min-w-[160px] flex-shrink-0">
              <h3 className="font-semibold text-sm mb-2 pb-1 border-b border-gray-300 dark:border-gray-700">
                {col} ({total})
              </h3>

              {cards.map((card) => (
                <div
                  key={card.name}
                  className="flex items-center gap-1 text-sm py-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1 cursor-default group"
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setHoveredCard({ name: card.name, imageUri: card.imageUri });
                    setTooltipPos({ x: rect.right + 8, y: rect.top });
                  }}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <span className="text-gray-500 dark:text-gray-400 text-xs shrink-0">
                    {card.quantity}×
                  </span>
                  <span className="flex-1 truncate">{card.name}</span>
                  {isOwner && (
                    <button
                      aria-label={`Remove ${card.name}`}
                      onClick={() =>
                        setRemovedNames((prev) => new Set([...prev, card.name]))
                      }
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-1 shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {added.map((name, i) => (
                <div
                  key={`added-${col}-${i}`}
                  className="flex items-center gap-1 text-sm py-0.5 px-1 text-blue-600 dark:text-blue-400"
                >
                  <span className="text-xs shrink-0">1×</span>
                  <span className="flex-1 truncate">{name}</span>
                  {isOwner && (
                    <button
                      aria-label={`Remove ${name}`}
                      onClick={() =>
                        setAddedByColumn((prev) => ({
                          ...prev,
                          [col]: prev[col].filter((_, j) => j !== i),
                        }))
                      }
                      className="text-red-400 hover:text-red-600 ml-1 shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {isOwner && (
                <input
                  aria-label={`Add card to ${col}`}
                  className="mt-2 w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Add card…"
                  value={addInputs[col] ?? ''}
                  onChange={(e) =>
                    setAddInputs((prev) => ({ ...prev, [col]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCard(col);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredCard?.imageUri && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <img
            src={hoveredCard.imageUri}
            alt={hoveredCard.name}
            className="w-48 rounded-lg shadow-xl"
          />
        </div>
      )}
    </div>
  );
};

export default DeckDetailPage;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/pages/__tests__/DeckDetailPage.test.tsx --no-coverage
```

Expected: 7 passing

- [ ] **Step 5: Commit**

```bash
git add src/pages/DeckDetailPage.tsx src/pages/__tests__/DeckDetailPage.test.tsx
git commit -m "feat: add DeckDetailPage with column layout and inline editing"
```

---

### Task 4: Update `App.tsx` routing

`/sandbox` → public (anyone can browse cards and try the AI builder without an account).
`/decks/:id` → public (anyone with the link can view a deck; edit controls render only for the owner).

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update imports and routes**

In `src/App.tsx`:

1. Add the import after the existing `DeckList` import line:

```tsx
import DeckDetailPage from './pages/DeckDetailPage';
```

2. Replace the two route lines:

```tsx
// Old:
<Route path="/decks/:id" element={protectedRoute(<DeckList />)} />
<Route path="/sandbox" element={protectedRoute(<Sandbox />)} />

// New:
<Route path="/decks/:id" element={publicRoute(<DeckDetailPage />)} />
<Route path="/sandbox" element={publicRoute(<Sandbox />)} />
```

The `DeckList` import (line 14) can remain — it's still used nowhere, but leave it for now to avoid a cascading diff. (If TypeScript complains about unused imports, remove it.)

- [ ] **Step 2: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass. If any existing test imports from `DeckList` and checks protected routing, update it to match the new public route.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: make /sandbox public, route /decks/:id to DeckDetailPage (public)"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| PATCH /decks/:id frontend call | Task 1 (`updateDeck`) |
| GET /decks/user/:user_id with user id | Tasks 1 + 2 (`fetchDeckListByName(userId)`) |
| DELETE /decks/:id frontend call | Task 1 (`deleteDeck`) |
| `/decks` auth-gated (RequireAuth in App.tsx) | existing routing kept; Task 4 does NOT change `/decks` wrapper |
| `/decks` empty state → Sandbox link | Task 2 |
| `/decks` loading spinner | Task 2 |
| `/decks` deck cards with name + format + date | Task 2 |
| `/decks/:id` public (anyone with link) | Task 4 |
| Column layout: Commander → Creature → … → Land | Task 3 (`ORDERED_TYPES`, `getColumnType`) |
| Column header shows type + count | Task 3 |
| Hover tooltip shows card image | Task 3 |
| Dark/light theme via Tailwind `dark:` | Task 3 (all classes use `dark:` variants) |
| Rename deck name inline (owner only) | Task 3 |
| Remove card with × (owner only) | Task 3 |
| Add card by name per column (owner only) | Task 3 |
| Save button disabled until dirty | Task 3 |
| Save calls PATCH with `{ name, cards }` | Task 3 |
| Save failure shows error, preserves edits | Task 3 |
| Unknown card names shown as list | Task 3 (`unknownCards` state) |
| Delete with `confirm()` dialog | Task 3 |
| Delete failure shows inline error | Task 3 |
| Navigate to `/decks` after delete | Task 3 |
| `window.beforeunload` when dirty | Task 3 |
| Sandbox → public route | Task 4 |

All requirements covered. No gaps found.

### Placeholder scan

No TBDs, no "add appropriate handling", no forward references to undefined types.

### Type consistency

- `fetchDeckListByID(id: string)` — used in `DeckDetailPage` with `id` from `useParams<{ id: string }>()`. ✓
- `updateDeck(id, { name, cards })` — `cards` typed as `{ name: string; quantity: number }[]`. Component builds this array from `deck.cards` and `addedByColumn`. ✓
- `deleteDeck(id: string)` — called with `id!` (id is `string | undefined` from params; guaranteed non-null at that call site since `!deck` guard exits first). ✓
- `selectCurrentUser` returns `User | null` where `User.id: string`. Owner check: `user.id === deck.owner` (both strings). ✓
