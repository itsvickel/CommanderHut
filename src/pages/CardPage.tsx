import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchCardByName, fetchListOfRandomCards } from '../services/cardService';
import { fetchDeckListByName, fetchDeckListByID, updateDeck } from '../services/deckService';
import { selectCurrentUser, selectIsAuthenticated } from '../store/AuthSlice';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';
import { Card } from '../types/cardTypes';

const COLORS = [
  { id: 'W', label: 'White' },
  { id: 'U', label: 'Blue' },
  { id: 'B', label: 'Black' },
  { id: 'R', label: 'Red' },
  { id: 'G', label: 'Green' },
];

const TYPES = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'];

const COLOR_ACTIVE: Record<string, string> = {
  W: 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-600',
  U: 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600',
  B: 'bg-gray-700 text-gray-100 border-gray-500',
  R: 'bg-red-100 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-300 dark:border-red-600',
  G: 'bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600',
};

const CardPage = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [listOfCards, setListOfCards] = useState<Card[]>([]);
  const [searchedCards, setSearchedCards] = useState<Card[]>([]);
  const [cardInput, setCardInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [userDecks, setUserDecks] = useState<any[]>([]);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [addingToDeck, setAddingToDeck] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearchedCards([]);
    try {
      const random = await fetchListOfRandomCards(40);
      setListOfCards(random);
    } catch {
      setError('Failed to load cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRandom(); }, [loadRandom]);

  const handleSearch = async () => {
    if (!cardInput.trim()) { loadRandom(); return; }
    setLoading(true);
    setError(null);
    try {
      const results = await fetchCardByName(cardInput);
      setSearchedCards(results);
    } catch {
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const displayedCards = useMemo(() => {
    const base = searchedCards.length > 0 ? searchedCards : listOfCards;
    return base.filter((card) => {
      const colorMatch =
        selectedColors.length === 0 ||
        selectedColors.some((c) => card.colors?.includes(c));
      const typeMatch =
        !selectedType || (card.type_line ?? '').includes(selectedType);
      return colorMatch && typeMatch;
    });
  }, [searchedCards, listOfCards, selectedColors, selectedType]);

  const toggleColor = (color: string) =>
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setShowDeckPicker(false);
    setAddFeedback(null);
  };

  const handleOpenDeckPicker = async () => {
    if (!user?.id) return;
    try {
      const decks = await fetchDeckListByName(user.id);
      setUserDecks(decks ?? []);
    } catch {
      setUserDecks([]);
    }
    setShowDeckPicker(true);
  };

  const handleAddToDeck = async (deckId: string, deckName: string) => {
    if (!selectedCard) return;
    setAddingToDeck(true);
    try {
      const deck = await fetchDeckListByID(deckId);
      const existing = (deck.cards ?? []).map(({ card, quantity }: any) => ({
        name: card.name,
        quantity,
      }));
      await updateDeck(deckId, {
        cards: [...existing, { name: selectedCard.name, quantity: 1 }],
      });
      setAddFeedback({ ok: true, msg: `Added to "${deckName}"` });
      setShowDeckPicker(false);
      setTimeout(() => setAddFeedback(null), 3000);
    } catch {
      setAddFeedback({ ok: false, msg: 'Failed to add card.' });
    } finally {
      setAddingToDeck(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex gap-2 mb-3">
            <input
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search cards by name…"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Search
            </button>
            {searchedCards.length > 0 && (
              <button
                onClick={() => { setCardInput(''); loadRandom(); }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 items-center">
            {COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => toggleColor(color.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedColors.includes(color.id)
                    ? COLOR_ACTIVE[color.id]
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {color.label}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedType === type
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {type}
              </button>
            ))}
            {(selectedColors.length > 0 || selectedType) && (
              <button
                onClick={() => { setSelectedColors([]); setSelectedType(null); }}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <Spinner label="Loading cards" />
          ) : error ? (
            <ErrorState message={error} retry={loadRandom} />
          ) : displayedCards.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-12 text-sm">
              No cards match the current filters.
            </p>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
            >
              {displayedCards.map((card, i) => (
                <button
                  key={`${card.id ?? card.name}-${i}`}
                  onClick={() => handleCardClick(card)}
                  className={`group relative rounded-lg overflow-hidden shadow hover:shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    selectedCard?.name === card.name
                      ? 'ring-2 ring-amber-400'
                      : ''
                  }`}
                >
                  {card.image_uris?.normal ? (
                    <img
                      src={card.image_uris.normal}
                      alt={card.name}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[5/7] bg-gray-200 dark:bg-gray-700 flex items-center justify-center p-2 text-xs text-center text-gray-600 dark:text-gray-400">
                      {card.name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-in detail panel */}
      <div
        className={`flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 overflow-y-auto ${
          selectedCard ? 'w-72' : 'w-0'
        }`}
      >
        {selectedCard && (
          <div className="p-4 w-72">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 pr-2 leading-snug">
                {selectedCard.name}
              </h3>
              <button
                onClick={() => { setSelectedCard(null); setShowDeckPicker(false); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {selectedCard.image_uris?.normal && (
              <img
                src={selectedCard.image_uris.normal}
                alt={selectedCard.name}
                className="w-full rounded-lg mb-3 shadow-md"
              />
            )}

            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-4">
              {selectedCard.mana_cost && (
                <p>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Cost: </span>
                  {selectedCard.mana_cost}
                </p>
              )}
              {selectedCard.type_line && (
                <p>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Type: </span>
                  {selectedCard.type_line}
                </p>
              )}
              {selectedCard.oracle_text && (
                <p className="whitespace-pre-line leading-relaxed">{selectedCard.oracle_text}</p>
              )}
            </div>

            {/* Add to deck */}
            {!isAuthenticated ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Sign in to add to a deck
              </p>
            ) : addFeedback ? (
              <p
                className={`text-xs text-center font-semibold ${
                  addFeedback.ok
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {addFeedback.msg}
              </p>
            ) : showDeckPicker ? (
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Choose a deck:
                </p>
                {userDecks.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No decks found.</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {userDecks.map((deck) => (
                      <button
                        key={deck._id}
                        onClick={() => handleAddToDeck(deck._id, deck.deck_name)}
                        disabled={addingToDeck}
                        className="w-full text-left px-2 py-1.5 rounded text-xs bg-gray-100 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                      >
                        {deck.deck_name}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowDeckPicker(false)}
                  className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenDeckPicker}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                + Add to Deck
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPage;
