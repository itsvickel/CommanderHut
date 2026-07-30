import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/AuthSlice';
import Home from '../home';
import { fetchPublicDecks } from '../../services/deckService';

jest.mock('../../services/deckService', () => ({
  fetchPublicDecks: jest.fn(),
}));

const user = { id: 'user1', username: 'alice', email_address: 'alice@test.com' };

const buildStore = (authUser: any = null) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        status: authUser ? ('authenticated' as const) : ('unauthenticated' as const),
        user: authUser,
      },
    },
  });

const renderPage = (authUser: any = null) =>
  render(
    <Provider store={buildStore(authUser)}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  (fetchPublicDecks as jest.Mock).mockResolvedValue({ decks: [], total: 0, page: 1, pages: 1 });
});

describe('Home', () => {
  it('shows sign-up and login links when logged out', async () => {
    renderPage();
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    await screen.findByText(/no public decks yet/i);
  });

  it('greets the user and links to Decksmith when logged in', async () => {
    renderPage(user);
    expect(screen.getByText(/welcome back, alice/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open decksmith/i })).toHaveAttribute('href', '/decksmith');
    await screen.findByText(/no public decks yet/i);
  });

  it('renders community decks when the API returns some', async () => {
    (fetchPublicDecks as jest.Mock).mockResolvedValue({
      decks: [{ _id: 'd1', deck_name: 'Krenko Goblins', commander: 'Krenko, Mob Boss', format: 'Commander' }],
      total: 1, page: 1, pages: 1,
    });
    renderPage();
    await screen.findByText('Krenko Goblins');
    expect(screen.getByText('Krenko, Mob Boss')).toBeInTheDocument();
  });

  it('shows a retryable error when loading community decks fails', async () => {
    (fetchPublicDecks as jest.Mock).mockRejectedValue(new Error('network'));
    renderPage();
    await screen.findByText(/failed to load community decks/i);
  });
});
