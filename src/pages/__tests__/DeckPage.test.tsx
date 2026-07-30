import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/AuthSlice';
import DeckPage from '../DeckPage';
import { fetchDeckListByName, deleteDeck } from '../../services/deckService';

jest.mock('../../services/deckService', () => ({
  fetchDeckListByName: jest.fn(),
  deleteDeck: jest.fn(),
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

  describe('deck actions', () => {
    const deck = {
      _id: 'deck1',
      deck_name: 'My Commander Deck',
      format: 'Commander',
      commander_image: '',
      updated_at: '2026-01-15T00:00:00.000Z',
    };

    beforeEach(() => {
      (fetchDeckListByName as jest.Mock).mockResolvedValue([deck]);
    });

    it('exposes an options menu on each deck card', async () => {
      renderPage();
      await screen.findByText('My Commander Deck');
      expect(screen.getByLabelText('Deck options')).toBeInTheDocument();
    });

    it('asks for confirmation before deleting', async () => {
      renderPage();
      await screen.findByText('My Commander Deck');
      fireEvent.click(screen.getByLabelText('Deck options'));
      fireEvent.click(screen.getByText(/Delete/));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(deleteDeck).not.toHaveBeenCalled();
    });

    it('removes the deck from the list after a confirmed delete', async () => {
      (deleteDeck as jest.Mock).mockResolvedValue(undefined);
      renderPage();
      await screen.findByText('My Commander Deck');
      fireEvent.click(screen.getByLabelText('Deck options'));
      fireEvent.click(screen.getByText(/Delete/));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(deleteDeck).toHaveBeenCalledWith('deck1'));
      await waitFor(() =>
        expect(screen.queryByText('My Commander Deck')).not.toBeInTheDocument()
      );
    });

    it('keeps the deck and shows the error when deletion fails', async () => {
      (deleteDeck as jest.Mock).mockRejectedValue(new Error('Forbidden'));
      renderPage();
      await screen.findByText('My Commander Deck');
      fireEvent.click(screen.getByLabelText('Deck options'));
      fireEvent.click(screen.getByText(/Delete/));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await screen.findByText('Forbidden');
      expect(screen.getByText('My Commander Deck')).toBeInTheDocument();
    });
  });
});
