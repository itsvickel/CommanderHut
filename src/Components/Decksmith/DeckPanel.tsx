import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { ParsedDeck } from '../../types/chat';
import { postDeckList } from '../../services/deckService';
import { RootState } from '../../store';
import DeckPanelEmpty from './DeckPanelEmpty';

interface Props {
  deck: ParsedDeck | null;
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

const DeckPanel = ({ deck }: Props) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!deck) return <DeckPanelEmpty />;

  const handleSave = async () => {
    if (!isAuthenticated || saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await postDeckList({
        commander: deck.commander,
        cards: deck.cards.map(c => ({ id: c._id, quantity: c.quantity })),
        name: `${deck.commander} deck`,
        format: 'Commander',
      });
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save deck:', err);
      setSaveStatus('error');
    }
  };

  return (
    <Panel>
      <Header>
        {deck.commanderImageUri && (
          <CommanderImage src={deck.commanderImageUri} alt={deck.commander} />
        )}
        <DeckTitle>{deck.commander}</DeckTitle>
        <Meta>Commander · {deck.cards.length + 1} cards</Meta>
      </Header>

      <CardList>
        <SectionLabel>Commander</SectionLabel>
        <CardRow>
          <CardName>{deck.commander}</CardName>
        </CardRow>
        <SectionLabel>Deck ({deck.cards.length})</SectionLabel>
        {deck.cards.map((card, i) => (
          <CardRow key={`${card._id}-${i}`}>
            <CardName>{card.quantity > 1 ? `${card.quantity}x ` : ''}{card.name}</CardName>
            {card.role && <CardRole>{card.role}</CardRole>}
          </CardRow>
        ))}
      </CardList>

      <Footer>
        {!isAuthenticated ? (
          <AuthNote>Sign in to save your deck</AuthNote>
        ) : (
          <SaveButton onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'success' ? 'Saved!' : 'Save Deck'}
          </SaveButton>
        )}
        {saveStatus === 'error' && <ErrorNote>Save failed — try again</ErrorNote>}
      </Footer>
    </Panel>
  );
};

export default DeckPanel;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 1px solid #e5e7eb;
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const CommanderImage = styled.img`
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  display: block;
`;

const DeckTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
`;

const Meta = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
`;

const CardList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const SectionLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.05em;
  margin: 0.5rem 0 0.25rem;
`;

const CardRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid #f9fafb;
`;

const CardName = styled.span`
  font-size: 0.82rem;
  color: #374151;
  flex: 1;
`;

const CardRole = styled.span`
  font-size: 0.7rem;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  flex-shrink: 0;
`;

const Footer = styled.div`
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.6rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  &:disabled { background: #93c5fd; cursor: not-allowed; }
`;

const AuthNote = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  margin: 0;
`;

const ErrorNote = styled.p`
  font-size: 0.8rem;
  color: #dc2626;
  text-align: center;
  margin: 0;
`;
