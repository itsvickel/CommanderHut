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
