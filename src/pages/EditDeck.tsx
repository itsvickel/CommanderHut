import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
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

  if (pageLoading) return <StatusMsg>Loading deck…</StatusMsg>;
  if (pageError) return <StatusMsg $error>{pageError}</StatusMsg>;

  return (
    <PageWrapper>
      <BackLink onClick={() => navigate('/decks')}>← Back to My Decks</BackLink>
      <PageTitle>Edit Deck</PageTitle>

      <TwoColumn>
        {/* ── LEFT: metadata ── */}
        <MetaColumn>
          <SectionLabel>Deck Info</SectionLabel>

          <Field>
            <Label>Deck Name</Label>
            <Input value={deckName} onChange={e => setDeckName(e.target.value)} />
          </Field>

          <Field>
            <Label>Format</Label>
            <Select value={format} onChange={e => setFormat(e.target.value)}>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>

          <Field style={{ position: 'relative' }}>
            <Label>Commander</Label>
            <Input
              value={commander}
              onChange={e => { setCommander(e.target.value); setShowCommanderSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowCommanderSuggestions(false), 150)}
            />
            {showCommanderSuggestions && commanderSuggestions.length > 0 && (
              <Suggestions>
                {commanderSuggestions.map(s => (
                  <SuggestionItem key={s} onMouseDown={() => selectCommander(s)}>{s}</SuggestionItem>
                ))}
              </Suggestions>
            )}
          </Field>

          <Field>
            <Label>Tags <Hint>(comma-separated)</Hint></Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. aggro, budget" />
          </Field>

          <ToggleRow>
            <ToggleSwitch
              $on={isPublic}
              onClick={() => setIsPublic(p => !p)}
              aria-label="Toggle public"
            />
            <ToggleLabel>
              {isPublic ? 'Public deck' : 'Private deck'}
              <ToggleHint>{isPublic ? 'Visible to everyone' : 'Only visible to you'}</ToggleHint>
            </ToggleLabel>
          </ToggleRow>

          {commanderImage && (
            <CommanderArt src={commanderImage} alt={`${commander} art`} />
          )}
        </MetaColumn>

        {/* ── RIGHT: card list ── */}
        <CardColumn>
          <CardHeader>
            <SectionLabel>Card List</SectionLabel>
            <CardCount>{cards.reduce((sum, c) => sum + c.quantity, 0)} cards</CardCount>
          </CardHeader>

          <Field style={{ position: 'relative' }}>
            <SearchInput
              value={cardQuery}
              onChange={e => setCardQuery(e.target.value)}
              placeholder="🔍 Search and add a card…"
            />
            {cardSearchLoading && <SearchHint>Searching…</SearchHint>}
            {cardResults.length > 0 && (
              <Suggestions>
                {cardResults.map(name => {
                  const alreadyIn = cards.some(c => c.name.toLowerCase() === name.toLowerCase());
                  return (
                    <SuggestionItem key={name} onMouseDown={() => addCard(name)}>
                      {name} {alreadyIn && <AlreadyIn>✓ in deck</AlreadyIn>}
                    </SuggestionItem>
                  );
                })}
              </Suggestions>
            )}
          </Field>

          <CardList>
            {cards.map(c => (
              <CardRow key={c.name}>
                <CardName>{c.name}</CardName>
                <CardControls>
                  <QtyBtn onClick={() => changeQuantity(c.name, -1)} disabled={c.quantity <= 1}>−</QtyBtn>
                  <Qty>{c.quantity}</Qty>
                  <QtyBtn onClick={() => changeQuantity(c.name, 1)}>+</QtyBtn>
                  <RemoveBtn onClick={() => removeCard(c.name)}>✕</RemoveBtn>
                </CardControls>
              </CardRow>
            ))}
          </CardList>
        </CardColumn>
      </TwoColumn>

      {saveError && <ErrorMsg>{saveError}</ErrorMsg>}
      {notFoundCards.length > 0 && (
        <ErrorMsg>Cards not found in database: {notFoundCards.join(', ')}</ErrorMsg>
      )}

      <Footer>
        <CancelBtn onClick={() => navigate('/decks')}>Cancel</CancelBtn>
        <SaveBtn onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </SaveBtn>
      </Footer>
    </PageWrapper>
  );
};

export default EditDeck;

/* ── Styled components ── */

const PageWrapper = styled.div`
  width: 90%;
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const BackLink = styled.span`
  font-size: 0.9rem;
  color: #888;
  cursor: pointer;
  &:hover { color: #333; }
`;

const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0.5rem 0 1.5rem;
  color: #111;
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  align-items: start;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const MetaColumn = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const CardColumn = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;

const SectionLabel = styled.div`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #999;
  margin-bottom: 2px;
`;

const Field = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const Label = styled.label`font-size: 0.85rem; color: #555; font-weight: 500;`;
const Hint = styled.span`font-weight: 400; color: #aaa; font-size: 0.8rem;`;

const Input = styled.input`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fafafa;
  &:focus { outline: none; border-color: #888; background: #fff; }
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fafafa;
  cursor: pointer;
`;

const Suggestions = styled.div`
  position: absolute;
  top: 100%;
  left: 0; right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  font-size: 0.88rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover { background: #f0f0f0; }
`;

const AlreadyIn = styled.span`font-size: 0.75rem; color: #27ae60;`;

const ToggleRow = styled.div`display: flex; align-items: center; gap: 10px; margin-top: 4px;`;

const ToggleSwitch = styled.div<{ $on: boolean }>`
  width: 40px; height: 22px;
  border-radius: 11px;
  background: ${({ $on }) => ($on ? '#27ae60' : '#ccc')};
  position: relative; cursor: pointer; flex-shrink: 0;
  transition: background 0.2s;
  &::after {
    content: '';
    position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff;
    top: 3px;
    left: ${({ $on }) => ($on ? '21px' : '3px')};
    transition: left 0.2s;
  }
`;

const ToggleLabel = styled.div`font-size: 0.88rem; color: #444; display: flex; flex-direction: column;`;
const ToggleHint = styled.span`font-size: 0.75rem; color: #aaa;`;

const CommanderArt = styled.img`
  width: 100%; border-radius: 8px; object-fit: cover;
  max-height: 120px; margin-top: 4px;
`;

const CardHeader = styled.div`display: flex; justify-content: space-between; align-items: baseline;`;
const CardCount = styled.span`font-size: 0.8rem; color: #999;`;

const SearchInput = styled(Input)`width: 100%; box-sizing: border-box;`;
const SearchHint = styled.div`font-size: 0.78rem; color: #aaa; margin-top: 2px;`;

const CardList = styled.div`
  display: flex; flex-direction: column; gap: 4px;
  max-height: 340px; overflow-y: auto;
`;

const CardRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 8px;
  background: #f9f9f9; border-radius: 5px;
  &:hover { background: #f0f0f0; }
`;

const CardName = styled.span`font-size: 0.88rem; color: #222; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;

const CardControls = styled.div`display: flex; align-items: center; gap: 4px; flex-shrink: 0;`;

const QtyBtn = styled.button`
  width: 22px; height: 22px; border: 1px solid #ddd; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 0.9rem; line-height: 1;
  &:hover:not(:disabled) { background: #e8e8e8; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const Qty = styled.span`min-width: 18px; text-align: center; font-size: 0.88rem;`;

const RemoveBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: #c0392b; font-size: 0.9rem; padding: 2px 4px;
  &:hover { color: #a93226; }
`;

const StatusMsg = styled.p<{ $error?: boolean }>`
  text-align: center; margin-top: 4rem;
  color: ${({ $error }) => ($error ? '#c0392b' : '#888')};
`;

const ErrorMsg = styled.p`color: #c0392b; font-size: 0.88rem; margin-top: 8px;`;

const Footer = styled.div`
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 24px; padding-top: 16px;
  border-top: 1px solid #eee;
`;

const CancelBtn = styled.button`
  padding: 9px 20px; border: 1px solid #ccc; border-radius: 7px;
  background: #fff; cursor: pointer; font-size: 0.9rem;
  &:hover { background: #f5f5f5; }
`;

const SaveBtn = styled.button`
  padding: 9px 20px; border: none; border-radius: 7px;
  background: #222; color: #fff; cursor: pointer;
  font-size: 0.9rem; font-weight: 600;
  &:hover:not(:disabled) { background: #444; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
