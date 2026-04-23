# Deck Panel: Hover Previews + Deck Page Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hovering a card row in the Decksmith panel shows a floating card image tooltip; after saving, a link to the full deck page appears.

**Architecture:** Both features live entirely in `src/Components/Decksmith/DeckPanel.tsx`. Hover state is local React state; the tooltip is an absolutely-positioned styled component that floats left of the panel. The deck page link stores the `_id` from the `postDeckList` response. Also fixes a latent bug: `state.auth.isAuthenticated` (always `undefined`) is replaced with the correct `selectIsAuthenticated` selector.

**Tech Stack:** React 19, styled-components, React Router `<Link>`, Jest + React Testing Library

---

## File Structure

- Modify: `src/Components/Decksmith/DeckPanel.tsx` — all changes go here
- Create: `src/Components/Decksmith/__tests__/DeckPanel.test.tsx` — new test file

---

### Task 1: Card Hover Tooltip

**Files:**
- Create: `src/Components/Decksmith/__tests__/DeckPanel.test.tsx`
- Modify: `src/Components/Decksmith/DeckPanel.tsx`

- [ ] **Step 1: Create the test file with scaffold and first failing test**

Create `src/Components/Decksmith/__tests__/DeckPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../../store/AuthSlice';
import DeckPanel from '../DeckPanel';
import { postDeckList } from '../../../services/deckService';
import { ParsedDeck } from '../../../types/chat';

jest.mock('../../../services/deckService', () => ({
  postDeckList: jest.fn(),
}));

const mockDeck: ParsedDeck = {
  generationId: 'gen-1',
  commander: 'Ayli, Eternal Pilgrim',
  commanderImageUri: 'https://example.com/ayli.jpg',
  cards: [
    {
      _id: 'card-1',
      name: 'Sol Ring',
      quantity: 1,
      role: 'ramp',
      image_uris: { normal: 'https://example.com/sol-ring.jpg' },
    },
    {
      _id: 'card-2',
      name: 'Swords to Plowshares',
      quantity: 1,
      role: 'removal',
      image_uris: { normal: 'https://example.com/stp.jpg' },
    },
  ],
  strategy: 'Lifegain strategy',
};

const buildStore = (authenticated: boolean) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        status: authenticated ? 'authenticated' : 'unauthenticated',
        user: authenticated
          ? { id: '1', username: 'test', email_address: 'test@test.com' }
          : null,
      },
    },
  });

const renderPanel = (deck: ParsedDeck | null, authenticated = true) =>
  render(
    <Provider store={buildStore(authenticated)}>
      <MemoryRouter>
        <DeckPanel deck={deck} />
      </MemoryRouter>
    </Provider>
  );

describe('DeckPanel hover tooltip', () => {
  it('shows card image tooltip on card row hover', () => {
    renderPanel(mockDeck);
    const cardRow = screen.getByText('Sol Ring').closest('div')!;
    fireEvent.mouseEnter(cardRow);
    expect(screen.getByAltText('Sol Ring')).toBeInTheDocument();
    expect(screen.getByAltText('Sol Ring')).toHaveAttribute(
      'src',
      'https://example.com/sol-ring.jpg'
    );
  });

  it('hides tooltip on mouse leave', () => {
    renderPanel(mockDeck);
    const cardRow = screen.getByText('Sol Ring').closest('div')!;
    fireEvent.mouseEnter(cardRow);
    fireEvent.mouseLeave(cardRow);
    expect(screen.queryByAltText('Sol Ring')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest DeckPanel.test --no-coverage
```

Expected: FAIL — "Unable to find an element with the alt text: Sol Ring"

- [ ] **Step 3: Implement the hover tooltip in DeckPanel.tsx**

Replace the full contents of `src/Components/Decksmith/DeckPanel.tsx` with:

```tsx
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ParsedDeck } from '../../types/chat';
import { postDeckList } from '../../services/deckService';
import { RootState } from '../../store';
import { selectIsAuthenticated } from '../../store/AuthSlice';
import DeckPanelEmpty from './DeckPanelEmpty';

interface Props {
  deck: ParsedDeck | null;
}

interface HoveredCard {
  name: string;
  imageUri: string;
  top: number;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const DeckPanel = ({ deck }: Props) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<HoveredCard | null>(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!deck) return <DeckPanelEmpty />;

  const handleHover = (
    e: React.MouseEvent<HTMLDivElement>,
    name: string,
    imageUri: string
  ) => {
    const panelRect = panelRef.current?.getBoundingClientRect();
    const rowRect = e.currentTarget.getBoundingClientRect();
    const top = panelRect
      ? rowRect.top - panelRect.top + rowRect.height / 2 - 100
      : 0;
    setHoveredCard({ name, imageUri, top: Math.max(0, top) });
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
    <Panel ref={panelRef}>
      {hoveredCard && (
        <CardTooltip style={{ top: hoveredCard.top }}>
          <img src={hoveredCard.imageUri} alt={hoveredCard.name} />
        </CardTooltip>
      )}

      <Header>
        {deck.commanderImageUri && (
          <CommanderImage src={deck.commanderImageUri} alt={deck.commander} />
        )}
        <DeckTitle>{deck.commander}</DeckTitle>
        <Meta>Commander · {deck.cards.length + 1} cards</Meta>
      </Header>

      <CardList>
        <SectionLabel>Commander</SectionLabel>
        <CardRow
          onMouseEnter={e => handleHover(e, deck.commander, deck.commanderImageUri)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardName>{deck.commander}</CardName>
        </CardRow>
        <SectionLabel>Deck ({deck.cards.length})</SectionLabel>
        {deck.cards.map((card, i) => (
          <CardRow
            key={`${card._id}-${i}`}
            onMouseEnter={e =>
              handleHover(
                e,
                card.name,
                card.image_uris.normal ?? card.image_uris.small ?? ''
              )
            }
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardName>
              {card.quantity > 1 ? `${card.quantity}x ` : ''}
              {card.name}
            </CardName>
            {card.role && <CardRole>{card.role}</CardRole>}
          </CardRow>
        ))}
      </CardList>

      <Footer>
        {!isAuthenticated ? (
          <AuthNote>Sign in to save your deck</AuthNote>
        ) : (
          <SaveButton onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'success'
              ? 'Saved!'
              : 'Save Deck'}
          </SaveButton>
        )}
        {saveStatus === 'error' && <ErrorNote>Save failed — try again</ErrorNote>}
        {savedDeckId && (
          <ViewDeckLink to={`/decks/${savedDeckId}`}>→ View Deck Page</ViewDeckLink>
        )}
      </Footer>
    </Panel>
  );
};

export default DeckPanel;

const Panel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 1px solid #e5e7eb;
`;

const CardTooltip = styled.div`
  position: absolute;
  right: 100%;
  width: 200px;
  padding-right: 8px;
  z-index: 200;
  pointer-events: none;
  img {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    display: block;
  }
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const CommanderImage = styled.img`
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  display: block;
`;

const DeckTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
`;

const Meta = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
`;

const CardList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const SectionLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.05em;
  margin: 0.5rem 0 0.25rem;
`;

const CardRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid #f9fafb;
  cursor: default;
`;

const CardName = styled.span`
  font-size: 0.82rem;
  color: #374151;
  flex: 1;
`;

const CardRole = styled.span`
  font-size: 0.7rem;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  flex-shrink: 0;
`;

const Footer = styled.div`
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.6rem;
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

const AuthNote = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  margin: 0;
`;

const ErrorNote = styled.p`
  font-size: 0.8rem;
  color: #dc2626;
  text-align: center;
  margin: 0;
`;

const ViewDeckLink = styled(Link)`
  display: block;
  text-align: center;
  font-size: 0.82rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;
```

- [ ] **Step 4: Run tests — hover tests should pass**

```bash
npx jest DeckPanel.test --no-coverage
```

Expected: `shows card image tooltip on card row hover` ✅ and `hides tooltip on mouse leave` ✅  
(The View Deck Page tests from Task 2 will be added next)

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/Components/Decksmith/DeckPanel.tsx src/Components/Decksmith/__tests__/DeckPanel.test.tsx
git commit -m "feat: add card hover tooltip to DeckPanel"
```

---

### Task 2: View Deck Page Link After Save

**Files:**
- Modify: `src/Components/Decksmith/__tests__/DeckPanel.test.tsx` — add View Deck Page tests
- No changes to `DeckPanel.tsx` — the `savedDeckId` state and `ViewDeckLink` are already in the implementation from Task 1

- [ ] **Step 1: Add View Deck Page tests to the existing test file**

Append a new `describe` block to `src/Components/Decksmith/__tests__/DeckPanel.test.tsx` (after the hover describe block):

```tsx
describe('DeckPanel deck page link', () => {
  beforeEach(() => {
    (postDeckList as jest.Mock).mockReset();
  });

  it('does not show View Deck Page link before saving', () => {
    renderPanel(mockDeck);
    expect(screen.queryByText('→ View Deck Page')).not.toBeInTheDocument();
  });

  it('shows View Deck Page link with correct href after successful save', async () => {
    (postDeckList as jest.Mock).mockResolvedValue({ _id: 'deck-123' });
    renderPanel(mockDeck);
    fireEvent.click(screen.getByText('Save Deck'));
    const link = await screen.findByRole('link', { name: '→ View Deck Page' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/decks/deck-123');
  });

  it('does not show View Deck Page link when save returns no _id', async () => {
    (postDeckList as jest.Mock).mockResolvedValue({});
    renderPanel(mockDeck);
    fireEvent.click(screen.getByText('Save Deck'));
    await screen.findByText('Saved!');
    expect(screen.queryByText('→ View Deck Page')).not.toBeInTheDocument();
  });

  it('shows Sign in note instead of Save button when unauthenticated', () => {
    renderPanel(mockDeck, false);
    expect(screen.getByText('Sign in to save your deck')).toBeInTheDocument();
    expect(screen.queryByText('Save Deck')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — all should pass**

```bash
npx jest DeckPanel.test --no-coverage
```

Expected: all 6 tests pass ✅

- [ ] **Step 3: Run full test suite to confirm no regressions**

```bash
npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/Components/Decksmith/__tests__/DeckPanel.test.tsx
git commit -m "test: add DeckPanel tests for hover tooltip and deck page link"
```
