import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageBoundary from '../PageBoundary';

const Boom = () => {
  throw new Error('kaboom');
};

const Toggle = () => {
  const [crashed, setCrashed] = useState(true);
  if (crashed) throw new Error('first render crash');
  return <div>recovered</div>;
};

describe('PageBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when they do not throw', () => {
    render(
      <PageBoundary>
        <div>hello</div>
      </PageBoundary>
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders ErrorState with retry when a child throws', () => {
    render(
      <PageBoundary>
        <Boom />
      </PageBoundary>
    );
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('retry resets internal state and attempts to re-render children', async () => {
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('flaky');
      return <div>stable</div>;
    };

    render(
      <PageBoundary>
        <Flaky />
      </PageBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('stable')).toBeInTheDocument();
  });
});
