import { render, screen, fireEvent } from '@testing-library/react';
import SessionsPanel from '../SessionsPanel';
import { DecksmithSession } from '../../../store/decksmithSlice';

const makeSession = (id: string, title: string, createdAt: string): DecksmithSession => ({
  id, title, messages: [], deck: null, pendingDiff: null, createdAt,
});

describe('SessionsPanel', () => {
  const sessions = [
    makeSession('1', 'Krenko Goblins', new Date().toISOString()),
    makeSession('2', 'Atraxa Counters', new Date(Date.now() - 86400000).toISOString()),
  ];

  it('renders all session titles', () => {
    render(
      <SessionsPanel sessions={sessions} activeSessionId="1" onSelectSession={jest.fn()} onNewSession={jest.fn()} />
    );
    expect(screen.getByText('Krenko Goblins')).toBeInTheDocument();
    expect(screen.getByText('Atraxa Counters')).toBeInTheDocument();
  });

  it('calls onSelectSession with the session id when clicked', () => {
    const onSelect = jest.fn();
    render(
      <SessionsPanel sessions={sessions} activeSessionId="1" onSelectSession={onSelect} onNewSession={jest.fn()} />
    );
    fireEvent.click(screen.getByText('Atraxa Counters'));
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('calls onNewSession when New session button is clicked', () => {
    const onNew = jest.fn();
    render(
      <SessionsPanel sessions={sessions} activeSessionId="1" onSelectSession={jest.fn()} onNewSession={onNew} />
    );
    fireEvent.click(screen.getByText('+ New session'));
    expect(onNew).toHaveBeenCalled();
  });

  it('renders the New session button even with no sessions', () => {
    render(
      <SessionsPanel sessions={[]} activeSessionId={null} onSelectSession={jest.fn()} onNewSession={jest.fn()} />
    );
    expect(screen.getByText('+ New session')).toBeInTheDocument();
  });
});
