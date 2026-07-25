import { render, screen, fireEvent } from '@testing-library/react';
import DeckDiffCard from '../DeckDiffCard';
import { DeckDiff } from '../../../types/chat';

const diff: DeckDiff = {
  summary: 'Swapped filler for removal.',
  adds: [{ _id: 'a1', name: 'Chaos Warp', role: 'removal' }],
  cuts: [{ _id: 'c1', name: 'Weak Goblin', reason: 'low impact' }],
};

describe('DeckDiffCard', () => {
  it('renders the summary, adds and cuts', () => {
    render(<DeckDiffCard diff={diff} onAccept={() => {}} onDiscard={() => {}} />);
    expect(screen.getByText('Swapped filler for removal.')).toBeInTheDocument();
    expect(screen.getByText('Chaos Warp')).toBeInTheDocument();
    expect(screen.getByText('Weak Goblin')).toBeInTheDocument();
    expect(screen.getByText(/Proposed changes \(1\)/)).toBeInTheDocument();
  });

  it('calls onAccept when Apply is clicked', () => {
    const onAccept = jest.fn();
    render(<DeckDiffCard diff={diff} onAccept={onAccept} onDiscard={() => {}} />);
    fireEvent.click(screen.getByText('Apply changes'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Discard is clicked', () => {
    const onDiscard = jest.fn();
    render(<DeckDiffCard diff={diff} onAccept={() => {}} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText('Discard'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('disables both actions while a request is in flight', () => {
    render(<DeckDiffCard diff={diff} onAccept={() => {}} onDiscard={() => {}} disabled />);
    expect(screen.getByText('Apply changes')).toBeDisabled();
    expect(screen.getByText('Discard')).toBeDisabled();
  });
});
