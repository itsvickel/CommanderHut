import { render, screen } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders with role="status" and aria-live="polite"', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders the default visually-hidden label "Loading"', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    render(<Spinner label="Fetching decks" />);
    expect(screen.getByText('Fetching decks')).toBeInTheDocument();
  });
});
