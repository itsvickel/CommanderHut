import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorState from '../ErrorState';

describe('ErrorState', () => {
  it('renders the message', () => {
    render(<ErrorState message="Failed to load decks" />);
    expect(screen.getByText('Failed to load decks')).toBeInTheDocument();
  });

  it('renders a default heading', () => {
    render(<ErrorState message="x" />);
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
  });

  it('does not render "Try again" when no retry is provided', () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders "Try again" and invokes retry on click', async () => {
    const retry = jest.fn();
    render(<ErrorState message="x" retry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
