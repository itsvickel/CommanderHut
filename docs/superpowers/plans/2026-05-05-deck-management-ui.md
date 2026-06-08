# Deck Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Edit and Delete controls to deck cards via a `···` overflow menu, backed by a full `/decks/:id/edit` page with metadata + card list editing.

**Architecture:** `DeckOverflowMenu` (owner-only dropdown) mounts on each card in `DeckPage`. Delete flows through `DeleteDeckModal` → `deleteDeck()` service → removes from local state. Edit navigates to `EditDeck` page which pre-loads via `fetchDeckListByID`, allows metadata and card list changes, and saves via `updateDeck()` service → `PATCH /api/decks/:id`.

**Tech Stack:** React 19, TypeScript, Styled Components, Redux Toolkit (`selectCurrentUser` from `AuthSlice`), React Router 7 (`useNavigate`, `useParams`), Axios, Scryfall API (commander autocomplete + art)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/Components/Deck/DeckOverflowMenu.tsx` | `···` button + dropdown (Edit, Delete) |
| Create | `src/Components/Deck/DeleteDeckModal.tsx` | Confirm modal for destructive delete |
| Create | `src/pages/EditDeck.tsx` | Full edit page: metadata form + card list editor |
| Modify | `src/services/deckService.ts` | Add `updateDeck` and `deleteDeck` |
| Modify | `src/pages/DeckPage.tsx` | Mount overflow menu; handle delete state |
| Modify | `src/App.tsx` | Register `/decks/:id/edit` protected route |

---

## Task 1: Add service functions

**Files:**
- Modify: `src/services/deckService.ts`
- Create: `src/services/__tests__/deckService.test.ts`

- [ ] **Step 1: Write failing tests for `updateDeck` and `deleteDeck`**

Create `src/services/__tests__/deckService.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { updateDeck, deleteDeck } from '../deckService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

beforeEach(() => vi.clearAllMocks());

describe('updateDeck', () => {
  it('sends PATCH request and returns updated deck', async () => {
    const mockDeck = { _id: 'abc123', deck_name: 'New Name' };
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: mockDeck });

    const result = await updateDeck('abc123', { deck_name: 'New Name' });

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('abc123'),
      { deck_name: 'New Name' }
    );
    expect(result).toEqual(mockDeck);
  });

  it('throws on non-2xx response', async () => {
    mockedAxios.patch = vi.fn().mockRejectedValue({ response: { status: 403 } });
    await expect(updateDeck('abc123', {})).rejects.toMatchObject({ response: { status: 403 } });
  });
});

describe('deleteDeck', () => {
  it('sends DELETE request', async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({ status: 204 });
    await deleteDeck('abc123');
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('abc123'));
  });

  it('throws on failure', async () => {
    mockedAxios.delete = vi.fn().mockRejectedValue({ response: { status: 404 } });
    await expect(deleteDeck('abc123')).rejects.toMatchObject({ response: { status: 404 } });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL (functions not defined)**

```bash
cd C:/Users/Vickel/Documents/project/CommanderHut
npx vitest run src/services/__tests__/deckService.test.ts
```

Expected: `Error: updateDeck is not a function`

- [ ] **Step 3: Add `updateDeck` and `deleteDeck` to `deckService.ts`**

Append to end of `src/services/deckService.ts`:

```typescript
export const updateDeck = async (id: string, payload: Record<string, any>): Promise<any> => {
  try {
    const response = await axios.patch(`${API_ENDPOINT.DECK_BASE_URL}/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
};

export const deleteDeck = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_ENDPOINT.DECK_BASE_URL}/${id}`);
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/services/__tests__/deckService.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/deckService.ts src/services/__tests__/deckService.test.ts
git commit -m "feat(decks): add updateDeck and deleteDeck service functions"
```

---

## Task 2: Create `DeckOverflowMenu` component

**Files:**
- Create: `src/Components/Deck/DeckOverflowMenu.tsx`

- [ ] **Step 1: Create the component**

Create `src/Components/Deck/DeckOverflowMenu.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

const DeckOverflowMenu = ({ onEdit, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onDelete();
  };

  return (
    <Wrapper ref={ref}>
      <TriggerButton onClick={handleToggle} aria-label="Deck options">
        •••
      </TriggerButton>
      {open && (
        <Dropdown>
          <DropdownItem onClick={handleEdit}>✏ Edit deck</DropdownItem>
          <DropdownItem $danger onClick={handleDelete}>🗑 Delete</DropdownItem>
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default DeckOverflowMenu;

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const TriggerButton = styled.button`
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  color: #444;
  letter-spacing: 2px;
  line-height: 1;
  &:hover { background: rgba(0, 0, 0, 0.15); }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 140px;
  z-index: 100;
  overflow: hidden;
`;

const DropdownItem = styled.button<{ $danger?: boolean }>`
  display: block;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${({ $danger }) => ($danger ? '#c0392b' : '#333')};
  &:hover {
    background: ${({ $danger }) => ($danger ? '#fdf0ef' : '#f5f5f5')};
  }
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Deck/DeckOverflowMenu.tsx
git commit -m "feat(decks): add DeckOverflowMenu component"
```

---

## Task 3: Create `DeleteDeckModal` component

**Files:**
- Create: `src/Components/Deck/DeleteDeckModal.tsx`

- [ ] **Step 1: Create the component**

Create `src/Components/Deck/DeleteDeckModal.tsx`:

```typescript
import styled from 'styled-components';

interface Props {
  isOpen: boolean;
  deckName: string;
  isDeleting: boolean;
  deleteError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteDeckModal = ({ isOpen, deckName, isDeleting, deleteError, onConfirm, onCancel }: Props) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={e => e.stopPropagation()}>
        <Title>Delete "{deckName}"?</Title>
        <Body>This action cannot be undone.</Body>
        {isDeleting && <StatusText>Deleting...</StatusText>}
        {deleteError && <ErrorText>{deleteError}</ErrorText>}
        <Actions>
          <CancelBtn onClick={onCancel} disabled={isDeleting}>Cancel</CancelBtn>
          <DeleteBtn onClick={onConfirm} disabled={isDeleting}>Delete</DeleteBtn>
        </Actions>
      </Modal>
    </Overlay>
  );
};

export default DeleteDeckModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h3`
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #c0392b;
`;

const Body = styled.p`
  margin: 0 0 20px;
  color: #555;
  font-size: 0.95rem;
`;

const StatusText = styled.p`
  color: #888;
  font-size: 0.85rem;
  margin: 0 0 12px;
`;

const ErrorText = styled.p`
  color: #c0392b;
  font-size: 0.85rem;
  margin: 0 0 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const CancelBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #f5f5f5; }
`;

const DeleteBtn = styled.button`
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: #c0392b;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #a93226; }
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Deck/DeleteDeckModal.tsx
git commit -m "feat(decks): add DeleteDeckModal confirm component"
```

---

## Task 4: Wire overflow menu and delete into `DeckPage`

**Files:**
- Modify: `src/pages/DeckPage.tsx`

- [ ] **Step 1: Update `DeckPage.tsx`**

Replace the full content of `src/pages/DeckPage.tsx`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchAllDecks, deleteDeck } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import DeckOverflowMenu from '../Components/Deck/DeckOverflowMenu';
import DeleteDeckModal from '../Components/Deck/DeleteDeckModal';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const DeckPage = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

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

  useEffect(() => { load(); }, [load]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDeck(deleteTarget.id);
      setDecks(prev => prev.filter(d => d._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Error deleting deck:', err);
      setDeleteError(err?.response?.data?.error ?? 'Failed to delete deck. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading decks" />;
  if (error) return <ErrorState message={error} retry={load} />;

  return (
    <PageWrapper>
      <SectionTitle>Your Decks</SectionTitle>
      <DeckGrid>
        {decks.length === 0 ? (
          <NoDecks>No decks found. Create one!</NoDecks>
        ) : (
          decks.map((item) => {
            const isOwner = item.owner === currentUser?.id;
            return (
              <DeckCard key={item._id} onClick={() => navigate(`/decks/${item._id}`)}>
                {isOwner && (
                  <OverflowWrapper>
                    <DeckOverflowMenu
                      onEdit={() => navigate(`/decks/${item._id}/edit`)}
                      onDelete={() => setDeleteTarget({ id: item._id, name: item.deck_name })}
                    />
                  </OverflowWrapper>
                )}
                <DeckCommanderImage
                  src={item.commander_image || '/images/placeholder_commander.png'}
                  alt={`${item.deck_name} Commander`}
                />
                <DeckInfo>
                  <DeckTitle>{item.deck_name}</DeckTitle>
                  <DeckDetails>
                    <DetailItem><strong>Owner:</strong> {item.owner_email || 'Anonymous'}</DetailItem>
                    <DetailItem>
                      <strong>Last Updated:</strong>{' '}
                      {new Date(item.updated_at).toLocaleDateString()}
                    </DetailItem>
                  </DeckDetails>
                </DeckInfo>
              </DeckCard>
            );
          })
        )}
      </DeckGrid>

      <DeleteDeckModal
        isOpen={!!deleteTarget}
        deckName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
      />
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

const DeckGrid = styled.div`
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
  position: relative;
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

const OverflowWrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
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

- [ ] **Step 2: Verify the page renders without errors**

Start the dev server and open `/decks` in the browser:
```bash
npm run dev
```
Expected: Deck cards show `···` button in the top-right corner for decks you own. Clicking `···` opens a dropdown with "✏ Edit deck" and "🗑 Delete". Clicking elsewhere closes the dropdown. Clicking a deck card still navigates to `/decks/:id`.

- [ ] **Step 3: Test delete flow manually**

1. Click `···` → "🗑 Delete" on one of your decks
2. Confirm the modal appears with the correct deck name
3. Click "Delete" — deck disappears from the list without a page reload
4. Click `···` → "🗑 Delete" → click outside or "Cancel" — deck is NOT removed

- [ ] **Step 4: Commit**

```bash
git add src/pages/DeckPage.tsx
git commit -m "feat(decks): wire DeckOverflowMenu and delete flow into DeckPage"
```

---

## Task 5: Create `EditDeck` page

**Files:**
- Create: `src/pages/EditDeck.tsx`

- [ ] **Step 1: Create the full EditDeck page**

Create `src/pages/EditDeck.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import axios from 'axios';
import { fetchDeckListByID, updateDeck } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import API_ENDPOINT from '../Constants/api';

interface CardEntry {
  name: string;
  quantity: number;
}

const FORMATS = ['Commander', 'Standard', 'Modern'] as const;

const EditDeck = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notFoundCards, setNotFoundCards] = useState<string[]>([]);

  // Form fields
  const [deckName, setDeckName] = useState('');
  const [format, setFormat] = useState<string>('Commander');
  const [commander, setCommander] = useState('');
  const [commanderImage, setCommanderImage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<CardEntry[]>([]);

  // Snapshot of loaded values — used to build diff payload on save
  const originalRef = useRef<any>(null);

  // Commander autocomplete
  const [commanderSuggestions, setCommanderSuggestions] = useState<string[]>([]);
  const [showCommanderSuggestions, setShowCommanderSuggestions] = useState(false);

  // Card search
  const [cardQuery, setCardQuery] = useState('');
  const [cardResults, setCardResults] = useState<string[]>([]);
  const [cardSearchLoading, setCardSearchLoading] = useState(false);

  // Load deck
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const deck = await fetchDeckListByID(id as any);
        if (deck.owner !== currentUser?.id) {
          navigate('/decks');
          return;
        }
        originalRef.current = deck;
        setDeckName(deck.deck_name ?? '');
        setFormat(deck.format ?? 'Commander');
        setCommander(deck.commander ?? '');
        setCommanderImage(deck.commander_image ?? '');
        setTags((deck.tags ?? []).join(', '));
        setIsPublic(deck.is_public ?? false);
        setCards(
          (deck.cards ?? []).map((c: any) => ({
            name: c.card?.name ?? c.name ?? '',
            quantity: c.quantity ?? 1,
          }))
        );
      } catch {
        setPageError('Failed to load deck. It may not exist.');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, currentUser, navigate]);

  // Commander autocomplete — Scryfall
  useEffect(() => {
    if (commander.length < 2) { setCommanderSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(commander)}`
        );
        setCommanderSuggestions((res.data?.data ?? []).slice(0, 5));
      } catch { /* non-fatal */ }
    }, 300);
    return () => clearTimeout(t);
  }, [commander]);

  const selectCommander = async (name: string) => {
    setCommander(name);
    setCommanderSuggestions([]);
    setShowCommanderSuggestions(false);
    try {
      const res = await axios.get(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
      );
      setCommanderImage(res.data?.image_uris?.art_crop ?? '');
    } catch { /* leave existing image */ }
  };

  // Card search — debounced
  useEffect(() => {
    if (cardQuery.length < 2) { setCardResults([]); return; }
    const t = setTimeout(async () => {
      setCardSearchLoading(true);
      try {
        const res = await axios.get(
          `${API_ENDPOINT.CARD_QUERY_BY_NAME}${encodeURIComponent(cardQuery)}`
        );
        setCardResults((res.data ?? []).map((c: any) => c.name).slice(0, 8));
      } catch { setCardResults([]); }
      finally { setCardSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [cardQuery]);

  const addCard = (name: string) => {
    setCards(prev => {
      const existing = prev.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return prev.map(c =>
          c.name.toLowerCase() === name.toLowerCase()
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { name, quantity: 1 }];
    });
    setCardQuery('');
    setCardResults([]);
  };

  const removeCard = (name: string) =>
    setCards(prev => prev.filter(c => c.name !== name));

  const changeQuantity = (name: string, delta: number) =>
    setCards(prev =>
      prev.map(c => {
        if (c.name !== name) return c;
        const next = c.quantity + delta;
        return next < 1 ? c : { ...c, quantity: next };
      })
    );

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setNotFoundCards([]);

    const orig = originalRef.current;
    const payload: Record<string, any> = {};

    if (deckName !== orig?.deck_name) payload.deck_name = deckName;
    if (format !== orig?.format) payload.format = format;
    if (commander !== orig?.commander) {
      payload.commander = commander;
      payload.commander_image = commanderImage;
    }

    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (JSON.stringify(tagsArr) !== JSON.stringify(orig?.tags ?? [])) {
      payload.tags = tagsArr;
    }

    if (isPublic !== orig?.is_public) payload.is_public = isPublic;

    const origCards: CardEntry[] = (orig?.cards ?? []).map((c: any) => ({
      name: c.card?.name ?? c.name ?? '',
      quantity: c.quantity,
    }));
    if (JSON.stringify(cards) !== JSON.stringify(origCards)) {
      payload.deck_list = cards.map(c => ({ card: c.name, quantity: c.quantity }));
    }

    try {
      await updateDeck(id!, payload);
      navigate('/decks');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.notFound) {
        setNotFoundCards(data.notFound);
        setSaveError('Some cards were not found in the database.');
      } else {
        setSaveError(data?.error ?? 'Failed to save deck. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <StatusMsg>Loading deck…</StatusMsg>;
  if (pageError) return <StatusMsg $error>{pageError}</StatusMsg>;

  return (
    <PageWrapper>
      <BackLink onClick={() => navigate('/decks')}>← Back to My Decks</BackLink>
      <PageTitle>Edit Deck</PageTitle>

      <TwoColumn>
        {/* ── LEFT: metadata ── */}
        <MetaColumn>
          <SectionLabel>Deck Info</SectionLabel>

          <Field>
            <Label>Deck Name</Label>
            <Input value={deckName} onChange={e => setDeckName(e.target.value)} />
          </Field>

          <Field>
            <Label>Format</Label>
            <Select value={format} onChange={e => setFormat(e.target.value)}>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>

          <Field style={{ position: 'relative' }}>
            <Label>Commander</Label>
            <Input
              value={commander}
              onChange={e => { setCommander(e.target.value); setShowCommanderSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowCommanderSuggestions(false), 150)}
            />
            {showCommanderSuggestions && commanderSuggestions.length > 0 && (
              <Suggestions>
                {commanderSuggestions.map(s => (
                  <SuggestionItem key={s} onMouseDown={() => selectCommander(s)}>{s}</SuggestionItem>
                ))}
              </Suggestions>
            )}
          </Field>

          <Field>
            <Label>Tags <Hint>(comma-separated)</Hint></Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. aggro, budget" />
          </Field>

          <ToggleRow>
            <ToggleSwitch
              $on={isPublic}
              onClick={() => setIsPublic(p => !p)}
              aria-label="Toggle public"
            />
            <ToggleLabel>
              {isPublic ? 'Public deck' : 'Private deck'}
              <ToggleHint>{isPublic ? 'Visible to everyone' : 'Only visible to you'}</ToggleHint>
            </ToggleLabel>
          </ToggleRow>

          {commanderImage && (
            <CommanderArt src={commanderImage} alt={`${commander} art`} />
          )}
        </MetaColumn>

        {/* ── RIGHT: card list ── */}
        <CardColumn>
          <CardHeader>
            <SectionLabel>Card List</SectionLabel>
            <CardCount>{cards.reduce((sum, c) => sum + c.quantity, 0)} cards</CardCount>
          </CardHeader>

          <Field style={{ position: 'relative' }}>
            <SearchInput
              value={cardQuery}
              onChange={e => setCardQuery(e.target.value)}
              placeholder="🔍 Search and add a card…"
            />
            {cardSearchLoading && <SearchHint>Searching…</SearchHint>}
            {cardResults.length > 0 && (
              <Suggestions>
                {cardResults.map(name => {
                  const alreadyIn = cards.some(c => c.name.toLowerCase() === name.toLowerCase());
                  return (
                    <SuggestionItem key={name} onMouseDown={() => addCard(name)}>
                      {name} {alreadyIn && <AlreadyIn>✓ in deck</AlreadyIn>}
                    </SuggestionItem>
                  );
                })}
              </Suggestions>
            )}
          </Field>

          <CardList>
            {cards.map(c => (
              <CardRow key={c.name}>
                <CardName>{c.name}</CardName>
                <CardControls>
                  <QtyBtn onClick={() => changeQuantity(c.name, -1)} disabled={c.quantity <= 1}>−</QtyBtn>
                  <Qty>{c.quantity}</Qty>
                  <QtyBtn onClick={() => changeQuantity(c.name, 1)}>+</QtyBtn>
                  <RemoveBtn onClick={() => removeCard(c.name)}>✕</RemoveBtn>
                </CardControls>
              </CardRow>
            ))}
          </CardList>
        </CardColumn>
      </TwoColumn>

      {saveError && <ErrorMsg>{saveError}</ErrorMsg>}
      {notFoundCards.length > 0 && (
        <ErrorMsg>Cards not found in database: {notFoundCards.join(', ')}</ErrorMsg>
      )}

      <Footer>
        <CancelBtn onClick={() => navigate('/decks')}>Cancel</CancelBtn>
        <SaveBtn onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </SaveBtn>
      </Footer>
    </PageWrapper>
  );
};

export default EditDeck;

/* ── Styled components ── */

const PageWrapper = styled.div`
  width: 90%;
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const BackLink = styled.span`
  font-size: 0.9rem;
  color: #888;
  cursor: pointer;
  &:hover { color: #333; }
`;

const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0 1.5rem;
  color: #111;
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  align-items: start;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const MetaColumn = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const CardColumn = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;

const SectionLabel = styled.div`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #999;
  margin-bottom: 2px;
`;

const Field = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const Label = styled.label`font-size: 0.85rem; color: #555; font-weight: 500;`;
const Hint = styled.span`font-weight: 400; color: #aaa; font-size: 0.8rem;`;

const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fafafa;
  &:focus { outline: none; border-color: #888; background: #fff; }
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fafafa;
  cursor: pointer;
`;

const Suggestions = styled.div`
  position: absolute;
  top: 100%;
  left: 0; right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover { background: #f0f0f0; }
`;

const AlreadyIn = styled.span`font-size: 0.75rem; color: #27ae60;`;

const ToggleRow = styled.div`display: flex; align-items: center; gap: 10px; margin-top: 4px;`;

const ToggleSwitch = styled.div<{ $on: boolean }>`
  width: 40px; height: 22px;
  border-radius: 11px;
  background: ${({ $on }) => ($on ? '#27ae60' : '#ccc')};
  position: relative; cursor: pointer; flex-shrink: 0;
  transition: background 0.2s;
  &::after {
    content: '';
    position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff;
    top: 3px;
    left: ${({ $on }) => ($on ? '21px' : '3px')};
    transition: left 0.2s;
  }
`;

const ToggleLabel = styled.div`font-size: 0.88rem; color: #444; display: flex; flex-direction: column;`;
const ToggleHint = styled.span`font-size: 0.75rem; color: #aaa;`;

const CommanderArt = styled.img`
  width: 100%; border-radius: 8px; object-fit: cover;
  max-height: 120px; margin-top: 4px;
`;

const CardHeader = styled.div`display: flex; justify-content: space-between; align-items: baseline;`;
const CardCount = styled.span`font-size: 0.8rem; color: #999;`;

const SearchInput = styled(Input)`width: 100%; box-sizing: border-box;`;
const SearchHint = styled.div`font-size: 0.78rem; color: #aaa; margin-top: 2px;`;

const CardList = styled.div`
  display: flex; flex-direction: column; gap: 4px;
  max-height: 340px; overflow-y: auto;
`;

const CardRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 8px;
  background: #f9f9f9; border-radius: 5px;
  &:hover { background: #f0f0f0; }
`;

const CardName = styled.span`font-size: 0.88rem; color: #222; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;

const CardControls = styled.div`display: flex; align-items: center; gap: 4px; flex-shrink: 0;`;

const QtyBtn = styled.button`
  width: 22px; height: 22px; border: 1px solid #ddd; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 0.9rem; line-height: 1;
  &:hover:not(:disabled) { background: #e8e8e8; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const Qty = styled.span`min-width: 18px; text-align: center; font-size: 0.88rem;`;

const RemoveBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: #c0392b; font-size: 0.9rem; padding: 2px 4px;
  &:hover { color: #a93226; }
`;

const StatusMsg = styled.p<{ $error?: boolean }>`
  text-align: center; margin-top: 4rem;
  color: ${({ $error }) => ($error ? '#c0392b' : '#888')};
`;

const ErrorMsg = styled.p`color: #c0392b; font-size: 0.88rem; margin-top: 8px;`;

const Footer = styled.div`
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 24px; padding-top: 16px;
  border-top: 1px solid #eee;
`;

const CancelBtn = styled.button`
  padding: 9px 20px; border: 1px solid #ccc; border-radius: 7px;
  background: #fff; cursor: pointer; font-size: 0.9rem;
  &:hover { background: #f5f5f5; }
`;

const SaveBtn = styled.button`
  padding: 9px 20px; border: none; border-radius: 7px;
  background: #222; color: #fff; cursor: pointer;
  font-size: 0.9rem; font-weight: 600;
  &:hover:not(:disabled) { background: #444; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/EditDeck.tsx
git commit -m "feat(decks): add EditDeck page with metadata and card list editing"
```

---

## Task 6: Register the route in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import and route**

Add the import after the `DeckList` import line:

```typescript
import EditDeck from './pages/EditDeck';
```

Add the route after `<Route path="/decks/:id" ...`:

```typescript
<Route path="/decks/:id/edit" element={protectedRoute(<EditDeck />)} />
```

- [ ] **Step 2: Verify end-to-end in the browser**

With the dev server running:
1. Go to `/decks` — deck cards show `···` menu for your own decks
2. Click `···` → "✏ Edit deck" → lands on `/decks/:id/edit` with form pre-filled
3. Change the deck name and click "Save Changes" → redirected back to `/decks`, name updated
4. Open the edited deck to confirm the new name persisted
5. Go back to `/decks`, click `···` → "🗑 Delete" → confirm → deck removed from list immediately

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(decks): register /decks/:id/edit protected route"
```
