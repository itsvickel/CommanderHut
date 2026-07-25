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
    expect(screen.getByRole('heading', { name: 'Commander 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Artifact 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Instant 1' })).toBeInTheDocument();
    expect(screen.getByAltText("Atraxa, Praetors' Voice")).toBeInTheDocument();
    expect(screen.getByAltText('Sol Ring')).toBeInTheDocument();
    expect(screen.getByAltText('Swords to Plowshares')).toBeInTheDocument();
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
    await screen.findByAltText('Sol Ring');
    fireEvent.click(screen.getByLabelText('Remove Sol Ring'));
    expect(screen.queryByAltText('Sol Ring')).not.toBeInTheDocument();
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
