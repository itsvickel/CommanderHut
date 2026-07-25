import { render, screen, fireEvent } from '@testing-library/react';
import DeckAnalysisPanel from '../DeckAnalysisPanel';
import { DeckAnalysis } from '../../../types/analysis';

const analysis: DeckAnalysis = {
  stats: {
    total_cards: 100,
    lands: 36,
    nonland_cards: 64,
    average_mana_value: 3.1,
    curve: { '0-1': 5, '2': 15, '3': 18, '4': 12, '5': 8, '6+': 6 },
    type_counts: { creature: 30, land: 36, instant: 10 },
    role_counts: { ramp: 10, draw: 9, removal: 8, counterspell: 2, tutor: 1, board_wipe: 2, recursion: 1 },
    color_pips: { W: 0, U: 0, B: 0, R: 40, G: 0 },
    game_changers: [],
    off_identity: [],
    estimated_bracket: 2,
    total_price_usd: 142.5,
  },
  observations: [],
  verdict: 'A focused goblin deck with a healthy curve.',
  strengths: ['Consistent curve'],
  weaknesses: ['Light on interaction'],
  suggestions: [{ _id: 's1', name: 'Impact Tremors', reason: 'Converts tokens into damage' }],
};

describe('DeckAnalysisPanel', () => {
  it('renders the verdict and headline stats', () => {
    render(<DeckAnalysisPanel analysis={analysis} onClose={() => {}} />);
    expect(screen.getByText('A focused goblin deck with a healthy curve.')).toBeInTheDocument();
    expect(screen.getByText('36')).toBeInTheDocument();
    expect(screen.getByText('3.1')).toBeInTheDocument();
    expect(screen.getByText('$142.5')).toBeInTheDocument();
  });

  it('renders strengths, weaknesses and suggestions', () => {
    render(<DeckAnalysisPanel analysis={analysis} onClose={() => {}} />);
    expect(screen.getByText('Consistent curve')).toBeInTheDocument();
    expect(screen.getByText('Light on interaction')).toBeInTheDocument();
    expect(screen.getByText('Impact Tremors')).toBeInTheDocument();
    expect(screen.getByText(/Converts tokens into damage/)).toBeInTheDocument();
  });

  it('warns about off-identity cards when present', () => {
    const illegal: DeckAnalysis = {
      ...analysis,
      stats: { ...analysis.stats, off_identity: ['Swords to Plowshares'] },
    };
    render(<DeckAnalysisPanel analysis={illegal} onClose={() => {}} />);
    expect(screen.getByText(/Swords to Plowshares/)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<DeckAnalysisPanel analysis={analysis} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close analysis'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the suggestions section when there are none', () => {
    render(<DeckAnalysisPanel analysis={{ ...analysis, suggestions: [] }} onClose={() => {}} />);
    expect(screen.queryByText('Suggested upgrades')).not.toBeInTheDocument();
  });
});
