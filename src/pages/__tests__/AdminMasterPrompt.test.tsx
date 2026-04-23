import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/AuthSlice';
import AdminMasterPrompt from '../AdminMasterPrompt';
import { getMasterPrompt, updateMasterPrompt } from '../../services/adminService';

jest.mock('../../services/adminService', () => ({
  getMasterPrompt: jest.fn(),
  updateMasterPrompt: jest.fn(),
}));

const buildStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        status: 'authenticated' as const,
        user: { id: '1', username: 'admin', email_address: 'admin@test.com', is_admin: true },
      },
    },
  });

const renderPage = () =>
  render(
    <Provider store={buildStore()}>
      <MemoryRouter>
        <AdminMasterPrompt />
      </MemoryRouter>
    </Provider>
  );

const mockData = {
  role_description: 'You are a deck builder',
  domain_restrictions: 'MTG only',
  additional_rules: 'Use real card names',
};

describe('AdminMasterPrompt', () => {
  beforeEach(() => {
    (getMasterPrompt as jest.Mock).mockResolvedValue(mockData);
    (updateMasterPrompt as jest.Mock).mockResolvedValue(mockData);
  });

  it('loads and displays prompt data on mount', async () => {
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    expect(screen.getByDisplayValue('MTG only')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Use real card names')).toBeInTheDocument();
  });

  it('shows Save Changes button after data loads', async () => {
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows Saved! after successful save', async () => {
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    fireEvent.click(screen.getByText('Save Changes'));
    await screen.findByText('Saved!');
  });

  it('shows error message when save fails', async () => {
    (updateMasterPrompt as jest.Mock).mockRejectedValue(new Error('Server error'));
    renderPage();
    await screen.findByDisplayValue('You are a deck builder');
    fireEvent.click(screen.getByText('Save Changes'));
    await screen.findByText('Save failed — try again');
  });

  it('shows fetch error when getMasterPrompt fails', async () => {
    (getMasterPrompt as jest.Mock).mockRejectedValue(new Error('403'));
    renderPage();
    await screen.findByText(/Failed to load master prompt/);
  });
});
