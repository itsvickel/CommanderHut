// src/Components/Decksmith/DeckPanel.tsx
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
        cards: deck.cards,
        name: `${deck.commander} deck`,
        format: 'Commander',
      });
      setSaveStatus('success');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <Panel>
      <Header>
        <DeckTitle>{deck.commander}</DeckTitle>
        <Meta>Commander · {deck.cards.length + 1} cards</Meta>
      </Header>

      <CardList>
        <CardRow><strong>{deck.commander}</strong> — Commander</CardRow>
        {deck.cards.map((name, i) => (
          <CardRow key={`${name}-${i}`}>{name}</CardRow>
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

const CardRow = styled.div`
  font-size: 0.82rem;
  color: #374151;
  padding: 0.2rem 0;
  border-bottom: 1px solid #f9fafb;
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
