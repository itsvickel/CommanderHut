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
