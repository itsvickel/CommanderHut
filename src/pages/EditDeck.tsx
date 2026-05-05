import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { fetchDeckListByID, updateDeck } from '../services/deckService';
import { selectCurrentUser } from '../store/AuthSlice';
import API_ENDPOINT from '../Constants/api';

interface CardEntry {
  name: string;
  quantity: number;
}

const FORMATS = ['Commander', 'Standard', 'Modern'] as const;

const EditDeck = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notFoundCards, setNotFoundCards] = useState<string[]>([]);

  // Form fields
  const [deckName, setDeckName] = useState('');
  const [format, setFormat] = useState<string>('Commander');
  const [commander, setCommander] = useState('');
  const [commanderImage, setCommanderImage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<CardEntry[]>([]);

  // Snapshot of loaded values — used to build diff payload on save
  const originalRef = useRef<any>(null);

  // Commander autocomplete
  const [commanderSuggestions, setCommanderSuggestions] = useState<string[]>([]);
  const [showCommanderSuggestions, setShowCommanderSuggestions] = useState(false);

  // Card search
  const [cardQuery, setCardQuery] = useState('');
  const [cardResults, setCardResults] = useState<string[]>([]);
  const [cardSearchLoading, setCardSearchLoading] = useState(false);

  // Load deck
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const deck = await fetchDeckListByID(id as any);
        if (deck.owner !== currentUser?.id) {
          navigate('/decks');
          return;
        }
        originalRef.current = deck;
        setDeckName(deck.deck_name ?? '');
        setFormat(deck.format ?? 'Commander');
        setCommander(deck.commander ?? '');
        setCommanderImage(deck.commander_image ?? '');
        setTags((deck.tags ?? []).join(', '));
        setIsPublic(deck.is_public ?? false);
        setCards(
          (deck.cards ?? []).map((c: any) => ({
            name: c.card?.name ?? c.name ?? '',
            quantity: c.quantity ?? 1,
          }))
        );
      } catch {
        setPageError('Failed to load deck. It may not exist.');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, currentUser, navigate]);

  // Commander autocomplete — Scryfall
  useEffect(() => {
    if (commander.length < 2) { setCommanderSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(commander)}`
        );
        setCommanderSuggestions((res.data?.data ?? []).slice(0, 5));
      } catch { /* non-fatal */ }
    }, 300);
    return () => clearTimeout(t);
  }, [commander]);

  const selectCommander = async (name: string) => {
    setCommander(name);
    setCommanderSuggestions([]);
    setShowCommanderSuggestions(false);
    try {
      const res = await axios.get(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
      );
      setCommanderImage(res.data?.image_uris?.art_crop ?? '');
    } catch { /* leave existing image */ }
  };

  // Card search — debounced
  useEffect(() => {
    if (cardQuery.length < 2) { setCardResults([]); return; }
    const t = setTimeout(async () => {
      setCardSearchLoading(true);
      try {
        const res = await axios.get(
          `${API_ENDPOINT.CARD_QUERY_BY_NAME}${encodeURIComponent(cardQuery)}`
        );
        setCardResults((res.data ?? []).map((c: any) => c.name).slice(0, 8));
      } catch { setCardResults([]); }
      finally { setCardSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [cardQuery]);

  const addCard = (name: string) => {
    setCards(prev => {
      const existing = prev.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return prev.map(c =>
          c.name.toLowerCase() === name.toLowerCase()
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { name, quantity: 1 }];
    });
    setCardQuery('');
    setCardResults([]);
  };

  const removeCard = (name: string) =>
    setCards(prev => prev.filter(c => c.name !== name));

  const changeQuantity = (name: string, delta: number) =>
    setCards(prev =>
      prev.map(c => {
        if (c.name !== name) return c;
        const next = c.quantity + delta;
        return next < 1 ? c : { ...c, quantity: next };
      })
    );

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setNotFoundCards([]);

    const orig = originalRef.current;
    const payload: Record<string, any> = {};

    if (deckName !== orig?.deck_name) payload.deck_name = deckName;
    if (format !== orig?.format) payload.format = format;
    if (commander !== orig?.commander) {
      payload.commander = commander;
      payload.commander_image = commanderImage;
    }

    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (JSON.stringify(tagsArr) !== JSON.stringify(orig?.tags ?? [])) {
      payload.tags = tagsArr;
    }

    if (isPublic !== orig?.is_public) payload.is_public = isPublic;

    const origCards: CardEntry[] = (orig?.cards ?? []).map((c: any) => ({
      name: c.card?.name ?? c.name ?? '',
      quantity: c.quantity,
    }));
    if (JSON.stringify(cards) !== JSON.stringify(origCards)) {
      payload.deck_list = cards.map(c => ({ card: c.name, quantity: c.quantity }));
    }

    try {
      await updateDeck(id!, payload);
      navigate('/decks');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.notFound) {
        setNotFoundCards(data.notFound);
        setSaveError('Some cards were not found in the database.');
      } else {
        setSaveError(data?.error ?? 'Failed to save deck. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <p className="text-center mt-16 text-[#888]">Loading deck…</p>;
  if (pageError) return <p className="text-center mt-16 text-[#c0392b]">{pageError}</p>;

  return (
    <div className="w-[90%] max-w-[900px] mx-auto my-8 p-4">
      <span
        onClick={() => navigate('/decks')}
        className="text-[0.9rem] text-[#888] cursor-pointer hover:text-[#333]"
      >
        ← Back to My Decks
      </span>
      <h2 className="text-[2rem] font-bold my-2 mb-6 text-[#111]">Edit Deck</h2>

      <div className="grid grid-cols-1 gap-8 items-start sm:grid-cols-[1fr_1.2fr]">
        {/* ── LEFT: metadata ── */}
        <div className="flex flex-col gap-3">
          <div className="text-[0.72rem] uppercase tracking-widest text-[#999] mb-0.5">Deck Info</div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.85rem] text-[#555] font-medium">Deck Name</label>
            <input
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              className="px-2.5 py-2 border border-[#ddd] rounded-md text-[0.9rem] bg-[#fafafa] focus:outline-none focus:border-[#888] focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.85rem] text-[#555] font-medium">Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="px-2.5 py-2 border border-[#ddd] rounded-md text-[0.9rem] bg-[#fafafa] cursor-pointer"
            >
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-[0.85rem] text-[#555] font-medium">Commander</label>
            <input
              value={commander}
              onChange={e => { setCommander(e.target.value); setShowCommanderSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowCommanderSuggestions(false), 150)}
              className="px-2.5 py-2 border border-[#ddd] rounded-md text-[0.9rem] bg-[#fafafa] focus:outline-none focus:border-[#888] focus:bg-white"
            />
            {showCommanderSuggestions && commanderSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-[#ddd] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-50 max-h-[200px] overflow-y-auto">
                {commanderSuggestions.map(s => (
                  <div
                    key={s}
                    onMouseDown={() => selectCommander(s)}
                    className="px-3 py-2 text-[0.88rem] cursor-pointer flex justify-between items-center hover:bg-[#f0f0f0]"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.85rem] text-[#555] font-medium">
              Tags <span className="font-normal text-[#aaa] text-[0.8rem]">(comma-separated)</span>
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. aggro, budget"
              className="px-2.5 py-2 border border-[#ddd] rounded-md text-[0.9rem] bg-[#fafafa] focus:outline-none focus:border-[#888] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 mt-1">
            <div
              onClick={() => setIsPublic(p => !p)}
              aria-label="Toggle public"
              className={`w-10 h-[22px] rounded-full relative cursor-pointer flex-shrink-0 transition-colors duration-200 ${isPublic ? 'bg-[#27ae60]' : 'bg-[#ccc]'}`}
            >
              <span
                className={`absolute w-4 h-4 rounded-full bg-white top-[3px] transition-all duration-200 ${isPublic ? 'left-[21px]' : 'left-[3px]'}`}
              />
            </div>
            <div className="text-[0.88rem] text-[#444] flex flex-col">
              {isPublic ? 'Public deck' : 'Private deck'}
              <span className="text-[0.75rem] text-[#aaa]">{isPublic ? 'Visible to everyone' : 'Only visible to you'}</span>
            </div>
          </div>

          {commanderImage && (
            <img
              src={commanderImage}
              alt={`${commander} art`}
              className="w-full rounded-lg object-cover max-h-[120px] mt-1"
            />
          )}
        </div>

        {/* ── RIGHT: card list ── */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <div className="text-[0.72rem] uppercase tracking-widest text-[#999] mb-0.5">Card List</div>
            <span className="text-[0.8rem] text-[#999]">{cards.reduce((sum, c) => sum + c.quantity, 0)} cards</span>
          </div>

          <div className="flex flex-col gap-1 relative">
            <input
              value={cardQuery}
              onChange={e => setCardQuery(e.target.value)}
              placeholder="🔍 Search and add a card…"
              className="w-full box-border px-2.5 py-2 border border-[#ddd] rounded-md text-[0.9rem] bg-[#fafafa] focus:outline-none focus:border-[#888] focus:bg-white"
            />
            {cardSearchLoading && <div className="text-[0.78rem] text-[#aaa] mt-0.5">Searching…</div>}
            {cardResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-[#ddd] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-50 max-h-[200px] overflow-y-auto">
                {cardResults.map(name => {
                  const alreadyIn = cards.some(c => c.name.toLowerCase() === name.toLowerCase());
                  return (
                    <div
                      key={name}
                      onMouseDown={() => addCard(name)}
                      className="px-3 py-2 text-[0.88rem] cursor-pointer flex justify-between items-center hover:bg-[#f0f0f0]"
                    >
                      {name} {alreadyIn && <span className="text-[0.75rem] text-[#27ae60]">✓ in deck</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto">
            {cards.map(c => (
              <div
                key={c.name}
                className="flex justify-between items-center px-2 py-1.5 bg-[#f9f9f9] rounded-md hover:bg-[#f0f0f0]"
              >
                <span className="text-[0.88rem] text-[#222] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{c.name}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => changeQuantity(c.name, -1)}
                    disabled={c.quantity <= 1}
                    className="w-[22px] h-[22px] border border-[#ddd] rounded bg-white cursor-pointer text-[0.9rem] leading-none hover:not-disabled:bg-[#e8e8e8] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="min-w-[18px] text-center text-[0.88rem]">{c.quantity}</span>
                  <button
                    onClick={() => changeQuantity(c.name, 1)}
                    className="w-[22px] h-[22px] border border-[#ddd] rounded bg-white cursor-pointer text-[0.9rem] leading-none hover:bg-[#e8e8e8]"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeCard(c.name)}
                    className="bg-none border-none cursor-pointer text-[#c0392b] text-[0.9rem] px-1 py-0.5 hover:text-[#a93226]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {saveError && <p className="text-[#c0392b] text-[0.88rem] mt-2">{saveError}</p>}
      {notFoundCards.length > 0 && (
        <p className="text-[#c0392b] text-[0.88rem] mt-2">Cards not found in database: {notFoundCards.join(', ')}</p>
      )}

      <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#eee]">
        <button
          onClick={() => navigate('/decks')}
          className="px-5 py-[9px] border border-[#ccc] rounded-lg bg-white cursor-pointer text-[0.9rem] hover:bg-[#f5f5f5]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-[9px] border-none rounded-lg bg-[#222] text-white cursor-pointer text-[0.9rem] font-semibold hover:not-disabled:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditDeck;
