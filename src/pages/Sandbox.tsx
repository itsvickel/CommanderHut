import React, { useEffect, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import DeckImport from '../Components/Deck/DeckImport';
import { postDeckList } from '../services/deckService';
import { fetchAllCards } from '../services/cardService';
import { Deck } from '../Interface/deck';
import { Debounce } from '../utils/helpers';
import colors from '../styles/colors.js'
interface RootState {
  auth: {
    user: {
      id: string;
      email: string;
    } | null;
  };
}

interface CommanderCard {
  name: string;
  image_uris?: { small?: string; normal?: string };
  id: string;
}

const formatMap: Record<string, string> = {
  commander: 'Commander',
  standard: 'Standard',
  modern: 'Modern',
  legacy: 'Legacy',
  pauper: 'Pauper',
};

const Sandbox: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState('');
  const [format, setFormat] = useState('commander');
  const [commander, setCommander] = useState('');
  const [commanderSuggestions, setCommanderSuggestions] = useState<CommanderCard[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCommanderImage, setSelectedCommanderImage] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [errorCards, setErrorCards] = useState<string[]>([]);

  const [openSection, setOpenSection] = useState<string>('Deck Name'); // only one open at a time

  useEffect(() => {
    fetchAllCards()
      .then((all) => setAllCards(all))
      .catch((err) => console.log(err));
  }, []);

  const handleCreateDeck = async () => {
    const parsedCards = deckCards
      .split('\n')
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match) return null;
        const [, count, name] = match;
        return { name: name.trim(), count: parseInt(count, 10) };
      })
      .filter(Boolean) as { name: string; count: number }[];

    if (parsedCards.length === 0) {
      alert('Deck list is empty or incorrectly formatted.');
      return;
    }

    try {
      const deck_list = parsedCards.map(({ name, count }) => ({
        card: name,
        quantity: count,
      }));

      const payload: Deck = {
        deck_name: deckName,
        format: formatMap[format.toLowerCase()] || 'Commander',
        commander: format === 'commander' ? commander : undefined,
        commander_image: format === 'commander' ? selectedCommanderImage || undefined : undefined,
        deck_list,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: user ? user?.id : 'anonymous',
        tags: [],
        is_public: false,
      };

      const res = await postDeckList(payload);

      if (res?.notFound?.length > 0) {
        setErrorCards(res.notFound);
        alert('Some cards could not be found.');
        return;
      }

      alert('Deck submitted successfully!');
      setDeckName('');
      setDeckCards('');
      setCommander('');
      setCommanderSuggestions([]);
      setShowSuggestions(false);
      setSelectedCommanderImage(null);
      setErrorCards([]);
    } catch (err: any) {
      console.log('Deck submit error:', err);
      if (err?.details?.notFound?.length > 0) {
        setErrorCards(err.details.notFound);
        alert('Some cards could not be found.');
      } else {
        alert('Failed to submit deck.');
      }
    }
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(e.target.value);
      };

  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  const handleCommanderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommander(value);
    setSelectedCommanderImage(null);
    fetchCommanderSuggestions(value);
  };

  const fetchCommanderSuggestions = Debounce(async (query: string) => {
    if (!query.trim()) {
      setCommanderSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}+is:commander&unique=prints`
      );
      const data = await res.json();

      if (data.object !== 'error') {
        const results = data.data.map((card: any) => ({
          name: card.name,
          image_uris: card.image_uris,
          id: card.id,
        }));
        setCommanderSuggestions(results);
        setShowSuggestions(true);
      } else {
        setCommanderSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      setCommanderSuggestions([]);
    }
  }, 300);

  return (
    <Wrapper>
      <Title>Deck Builder</Title>

      <MainContainer>
        <CollapsibleSection
          title="Deck Name"
          value={deckName}
          isOpen={openSection === 'Deck Name'}
          setOpenSection={setOpenSection}
        >
          <Input value={deckName} placeholder="Deck Name" onChange={handleChange(setDeckName)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Format"
          value={formatMap[format]}
          isOpen={openSection === 'Format'}
          setOpenSection={setOpenSection}
        >
          <Select value={format} onChange={handleFormatChange}>
            <option value="commander">Commander</option>
            <option value="standard">Standard</option>
            <option value="modern">Modern</option>
            <option value="legacy">Legacy</option>
            <option value="pauper">Pauper</option>
          </Select>
        </CollapsibleSection>

        {format === 'commander' && (
          <CollapsibleSection
            title="Commander"
            value={commander || undefined}
            isOpen={openSection === 'Commander'}
            setOpenSection={setOpenSection}
          >
            <Input
              value={commander}
              onChange={handleCommanderChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => commander && setShowSuggestions(true)}
              placeholder="Add your Commander"
            />
            {showSuggestions && commanderSuggestions.length > 0 && (
              <SuggestionBox>
                {commanderSuggestions.map((card) => (
                  <SuggestionItem
                    key={card.id}
                    onClick={() => {
                      setCommander(card.name);
                      setSelectedCommanderImage(card.image_uris?.normal || null);
                      setShowSuggestions(false);
                    }}
                  >
                    {card.image_uris?.small && <img src={card.image_uris.small} alt={card.name} />}
                    {card.name}
                  </SuggestionItem>
                ))}
              </SuggestionBox>
            )}
            {selectedCommanderImage && (
              <CommanderImageWrapper>
                <img src={selectedCommanderImage} alt="Selected Commander" />
              </CommanderImageWrapper>
            )}
          </CollapsibleSection>
        )}

        <CollapsibleSection
          title="Deck Cards"
          hideSummary
          isOpen={openSection === 'Deck Cards'}
          setOpenSection={setOpenSection}
        >
          <DeckImport
            onImport={(cards) => {
              const counts: Record<string, number> = {};
              cards.forEach((card) => {
                const name = card.name.trim();
                counts[name] = (counts[name] || 0) + 1;
              });
              const formatted = Object.entries(counts)
                .map(([name, count]) => `${count} ${name}`)
                .join('\n');
              setDeckCards(formatted);
            }}
          />

          {errorCards.length > 0 && (
            <ErrorBox>
              <h4>❌ The following cards were not found:</h4>
              <ul>
                {errorCards.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </ErrorBox>
          )}

          <TextArea
            rows={10}
            value={deckCards}
            onChange={handleChange(setDeckCards)}
            placeholder="Enter cards one per line, e.g. '4 Lightning Bolt'"
          />
        </CollapsibleSection>

      </MainContainer>

      <Button name="Create Deck" onClick={handleCreateDeck} disabled={!deckName.trim()} />
    </Wrapper>
  );
};

export default Sandbox;

/* ---------------- Styled Components ---------------- */
const Wrapper = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
`;

const Title = styled.h1`
  font-size: 2.4rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
  color: #111827;
  &:after {
    content: "";
    display: block;
    height: 4px;
    width: 80px;
    margin: 0.5rem auto 0;
    background: linear-gradient(to right, #2563eb, #9333ea);
    border-radius: 2px;
  }
`;

const CollapsibleWrapper = styled.div`
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const CollapsibleHeader = styled.div<{ open: boolean }>`
  background: #f3f4f6;
  padding: 0.8rem 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover {
    background: #e5e7eb;
  }
`;

const CollapsibleContent = styled.div<{ open: boolean }>`
  max-height: ${({ open }) => (open ? '1000px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${({ open }) => (open ? '1rem' : '0 1rem')};
`;

const Arrow = styled.span<{ open: boolean }>`
  transform: rotate(${({ open }) => (open ? '90deg' : '0deg')});
  transition: transform 0.3s ease;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: #f9fafb;
  color: ${colors.black};
  &:focus {
    border-color: #2563eb;
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  font-family: monospace;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-top: 0.5rem;
  background-color: #f9fafb;
  resize: vertical;
  color: ${colors.black};
`;

const SuggestionBox = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-top: none;
  max-height: 250px;
  overflow-y: auto;
  background: white;
  position: absolute;
  width: calc(100% - 2rem);
  z-index: 100;
  border-radius: 0 0 8px 8px;
`;

const SuggestionItem = styled.li`
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover {
    background-color: #f3f4f6;
  }
  img {
    width: 40px;
    margin-right: 10px;
    border-radius: 4px;
  }
`;

const ErrorBox = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  color: #991b1b;
`;

const CommanderImageWrapper = styled.div`
  margin-top: 1rem;
  text-align: center;
  img {
    max-width: 240px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
`;

const MainContainer = styled.div`
  scroll: auto;
  max-height: 100%;
`;

/* ---------------- Collapsible Section Component ---------------- */
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  value?: string | null;
  hideSummary?: boolean;
  isOpen: boolean;
  setOpenSection: (title: string) => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  value,
  hideSummary,
  isOpen,
  setOpenSection,
}) => {
  const handleToggle = () => setOpenSection(isOpen ? '' : title);

  return (
    <CollapsibleWrapper>
      <CollapsibleHeader open={isOpen} onClick={handleToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {title}
          {!isOpen && !hideSummary && value && (
            <span style={{ color: '#10b981', fontWeight: 500 }}>✔ {value}</span>
          )}
        </div>
        <Arrow open={isOpen}>▶</Arrow>
      </CollapsibleHeader>
      <CollapsibleContent open={isOpen}>{children}</CollapsibleContent>
    </CollapsibleWrapper>
  );
};
