import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ParsedDeck } from '../../types/chat';
import { saveAIDeck } from '../../services/aiService';
import { selectIsAuthenticated } from '../../store/AuthSlice';
import DeckPanelEmpty from './DeckPanelEmpty';

interface Props {
  deck: ParsedDeck | null;
  onSave?: (deckName: string) => void;
}
interface HoveredCard { name: string; imageUri: string; top: number; right: number; }
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const DeckPanel = ({ deck, onSave }: Props) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<HoveredCard | null>(null);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  if (!deck) return <DeckPanelEmpty />;

  const handleHover = (e: React.MouseEvent<HTMLDivElement>, name: string, imageUri: string) => {
    const rowRect = e.currentTarget.getBoundingClientRect();
    const top = rowRect.top + rowRect.height / 2 - 100;
    const right = window.innerWidth - rowRect.left + 8;
    setHoveredCard({ name, imageUri, top: Math.max(0, top), right });
  };

  const handleSave = async () => {
    if (!isAuthenticated || saveStatus === 'saving') return;
    if (!deck.generationId) {
      setSaveError('This deck has no active generation — please regenerate it');
      setSaveStatus('error');
      return;
    }
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const deckName = `${deck.commander} deck`;
      const result = await saveAIDeck(deck.generationId, deckName);
      setSavedDeckId(result.deck?._id ?? null);
      setSaveStatus('success');
      onSave?.(deckName);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save deck:', err);
      setSaveError(err instanceof Error ? err.message : 'Save failed — try again');
      setSaveStatus('error');
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {hoveredCard && (
        <div
          className="fixed w-48 pr-2 z-50 pointer-events-none"
          style={{ top: hoveredCard.top, right: hoveredCard.right }}
        >
          <img src={hoveredCard.imageUri} alt={hoveredCard.name} className="w-full rounded-lg shadow-2xl block" />
        </div>
      )}

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {deck.commanderImageUri && (
          <img src={deck.commanderImageUri} alt={deck.commander} className="w-full rounded-lg mb-3 block" />
        )}
        <h3 className="m-0 mb-1 text-base font-bold text-gray-900 dark:text-gray-100">{deck.commander}</h3>
        <p className="m-0 text-xs text-gray-500 dark:text-gray-400">Commander · {deck.cards.length + 1} cards</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-0.5">
        <div className="text-xs font-bold uppercase text-gray-400 tracking-widest my-2">Commander</div>
        <div
          className="flex items-baseline gap-2 py-1 border-b border-gray-50 dark:border-gray-800 cursor-default"
          onMouseEnter={e => handleHover(e, deck.commander, deck.commanderImageUri ?? '')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{deck.commander}</span>
        </div>
        <div className="text-xs font-bold uppercase text-gray-400 tracking-widest my-2">Deck ({deck.cards.length})</div>
        {deck.cards.map((card, i) => (
          <div
            key={`${card._id}-${i}`}
            className="flex items-baseline gap-2 py-1 border-b border-gray-50 dark:border-gray-800 cursor-default"
            onMouseEnter={e => handleHover(e, card.name, card.image_uris.normal ?? card.image_uris.small ?? '')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
              {card.quantity > 1 ? `${card.quantity}x ` : ''}{card.name}
            </span>
            {card.role && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded px-1 py-0.5 flex-shrink-0">
                {card.role}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col gap-1">
        {!isAuthenticated ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center m-0">Sign in to save your deck</p>
        ) : (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors border-none cursor-pointer disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'success' ? 'Saved!' : 'Save Deck'}
          </button>
        )}
        {saveStatus === 'error' && (
          <p className="text-xs text-red-600 dark:text-red-400 text-center m-0">
            {saveError ?? 'Save failed — try again'}
          </p>
        )}
        {savedDeckId && (
          <Link
            to={`/decks/${savedDeckId}`}
            className="block text-center text-xs text-blue-600 dark:text-blue-400 font-semibold no-underline hover:underline"
          >
            → View Deck Page
          </Link>
        )}
      </div>
    </div>
  );
};

export default DeckPanel;
