import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchDeckListByID, updateDeck, deleteDeck } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const ORDERED_TYPES = [
  'Commander', 'Creature', 'Instant', 'Sorcery',
  'Enchantment', 'Artifact', 'Planeswalker', 'Land',
];

function getColumnType(cardName: string, commanderName: string, typeLine: string): string {
  if (cardName === commanderName) return 'Commander';
  const supertype = (typeLine ?? '').split(' — ')[0];
  for (const t of ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land']) {
    if (supertype.includes(t)) return t;
  }
  return 'Other';
}

interface DisplayCard {
  name: string;
  quantity: number;
  imageUri: string;
}

const DeckDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [pendingName, setPendingName] = useState('');
  const [removedNames, setRemovedNames] = useState<Set<string>>(new Set());
  const [addedByColumn, setAddedByColumn] = useState<Record<string, string[]>>({});
  const [addInputs, setAddInputs] = useState<Record<string, string | undefined>>({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unknownCards, setUnknownCards] = useState<string[]>([]);

  const [hoveredCard, setHoveredCard] = useState<{ name: string; imageUri: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const loadDeck = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchDeckListByID(id);
      setDeck(data);
      setPendingName(data.deck_name ?? '');
    } catch {
      setFetchError('Failed to load deck.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDeck(); }, [loadDeck]);

  const isOwner = !!(user && deck && user.id === deck.owner);

  const isDirty = !!deck && (
    pendingName !== deck.deck_name ||
    removedNames.size > 0 ||
    Object.values(addedByColumn).some((a) => a.length > 0)
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const groupedCards = useMemo((): Record<string, DisplayCard[]> => {
    if (!deck) return {};
    const groups: Record<string, DisplayCard[]> = {};
    for (const { card, quantity } of deck.cards ?? []) {
      if (removedNames.has(card.name)) continue;
      const col = getColumnType(card.name, deck.commander, card.type_line ?? '');
      if (!groups[col]) groups[col] = [];
      groups[col].push({
        name: card.name,
        quantity,
        imageUri: card.image_uris?.normal ?? card.image_uris?.small ?? '',
      });
    }
    return groups;
  }, [deck, removedNames]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    setUnknownCards([]);
    const cards = [
      ...(deck.cards ?? [])
        .filter(({ card }: any) => !removedNames.has(card.name))
        .map(({ card, quantity }: any) => ({ name: card.name, quantity })),
      ...Object.values(addedByColumn)
        .flat()
        .map((name: string) => ({ name, quantity: 1 })),
    ];
    try {
      const updated = await updateDeck(id, { name: pendingName, cards });
      setDeck(updated);
      setPendingName(updated.deck_name ?? '');
      setRemovedNames(new Set());
      setAddedByColumn({});
    } catch (err: any) {
      setSaveError(err.message || 'Save failed.');
      if (err.details?.unknownCards) setUnknownCards(err.details.unknownCards);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this deck? This cannot be undone.')) return;
    try {
      await deleteDeck(id!);
      navigate('/decks');
    } catch {
      setSaveError('Delete failed. Please try again.');
    }
  };

  const handleAddCard = (col: string) => {
    const name = (addInputs[col] ?? '').trim();
    if (!name) return;
    setAddedByColumn((prev) => ({ ...prev, [col]: [...(prev[col] ?? []), name] }));
    setAddInputs((prev) => { const next = { ...prev }; delete next[col]; return next; });
  };

  const openAddInput = (col: string) =>
    setAddInputs((prev) => ({ ...prev, [col]: '' }));

  const closeAddInput = (col: string) =>
    setAddInputs((prev) => { const next = { ...prev }; delete next[col]; return next; });

  if (loading) return <Spinner label="Loading deck" />;
  if (fetchError) return <ErrorState message={fetchError} retry={loadDeck} />;
  if (!deck) return null;

  const totalCards = (deck.cards ?? []).reduce(
    (sum: number, { quantity }: any) => sum + quantity, 0
  );

  const nonStandardCols = Object.keys(groupedCards).filter(
    (k) => !ORDERED_TYPES.includes(k)
  );
  const allColumns = isOwner
    ? [...ORDERED_TYPES, ...nonStandardCols]
    : [...ORDERED_TYPES, ...nonStandardCols].filter(
        (col) =>
          (groupedCards[col]?.length ?? 0) > 0 ||
          (addedByColumn[col]?.length ?? 0) > 0
      );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {/* Header */}
      <div className="max-w-screen-xl mx-auto mb-6 flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0">
          {isOwner ? (
            <>
              <h1 className="sr-only">{pendingName || deck.deck_name}</h1>
              <input
                aria-label="Deck name"
                className="text-3xl font-bold bg-transparent border-b border-gray-400 dark:border-gray-600 focus:outline-none w-full"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
              />
            </>
          ) : (
            <h1 className="text-3xl font-bold truncate">{deck.deck_name}</h1>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {deck.format} · {totalCards} cards
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-3 items-start flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold disabled:opacity-40 hover:bg-amber-600 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <p className="text-red-500 text-sm mb-4 max-w-screen-xl mx-auto">{saveError}</p>
      )}
      {unknownCards.length > 0 && (
        <ul className="text-red-500 text-sm mb-4 max-w-screen-xl mx-auto list-disc pl-4">
          {unknownCards.map((n) => (
            <li key={n}>Unknown card: {n}</li>
          ))}
        </ul>
      )}

      {/* Card sections grouped by type */}
      <div className="max-w-screen-xl mx-auto space-y-8 pb-8">
        {allColumns.map((col) => {
          const cards = groupedCards[col] ?? [];
          const added = addedByColumn[col] ?? [];
          const total = cards.reduce((s, c) => s + c.quantity, 0) + added.length;
          if (!isOwner && total === 0) return null;

          return (
            <div key={col}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                {col}
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-normal">
                  {total}
                </span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {/* Existing cards */}
                {cards.map((card) => (
                  <div
                    key={card.name}
                    className="relative group flex-shrink-0 cursor-default"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const tooltipWidth = 192;
                      const x = rect.right + 8 + tooltipWidth > window.innerWidth
                        ? rect.left - tooltipWidth - 8
                        : rect.right + 8;
                      setHoveredCard({ name: card.name, imageUri: card.imageUri });
                      setTooltipPos({ x, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {card.imageUri ? (
                      <img
                        src={card.imageUri}
                        alt={card.name}
                        className="w-20 rounded-md shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-300 dark:bg-gray-600 rounded-md flex items-center justify-center text-xs text-center p-1 shadow-md">
                        {card.name}
                      </div>
                    )}
                    {card.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs rounded px-1 leading-tight">
                        ×{card.quantity}
                      </span>
                    )}
                    {isOwner && (
                      <button
                        aria-label={`Remove ${card.name}`}
                        onClick={() =>
                          setRemovedNames((prev) => new Set([...prev, card.name]))
                        }
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center transition-opacity"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Pending (added) cards */}
                {added.map((name, i) => (
                  <div key={`added-${col}-${i}`} className="relative flex-shrink-0">
                    <div className="w-20 h-28 border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md flex items-center justify-center text-xs text-center p-1 text-amber-700 dark:text-amber-400">
                      {name}
                    </div>
                    <button
                      aria-label={`Remove ${name}`}
                      onClick={() =>
                        setAddedByColumn((prev) => ({
                          ...prev,
                          [col]: prev[col].filter((_, j) => j !== i),
                        }))
                      }
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add card slot (owner only) */}
                {isOwner && (
                  <div className="w-20 h-28 flex-shrink-0">
                    {addInputs[col] !== undefined ? (
                      <div className="flex flex-col h-full gap-1">
                        <input
                          aria-label={`Add card to ${col}`}
                          className="flex-1 w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="Card name…"
                          value={addInputs[col] ?? ''}
                          autoFocus
                          onChange={(e) =>
                            setAddInputs((prev) => ({ ...prev, [col]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCard(col);
                            if (e.key === 'Escape') closeAddInput(col);
                          }}
                          onBlur={() => {
                            if (!addInputs[col]) closeAddInput(col);
                          }}
                        />
                        <button
                          onClick={() => handleAddCard(col)}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white rounded px-1 py-0.5 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        aria-label={`Add card to ${col}`}
                        onClick={() => openAddInput(col)}
                        className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center text-2xl text-gray-400 dark:text-gray-600 hover:border-amber-400 hover:text-amber-400 transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredCard?.imageUri && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <img
            src={hoveredCard.imageUri}
            alt={hoveredCard.name}
            className="w-48 rounded-lg shadow-xl"
          />
        </div>
      )}
    </div>
  );
};

export default DeckDetailPage;
