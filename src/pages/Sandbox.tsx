import React, { useEffect, useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import DeckImport from '../Components/Deck/DeckImport';
import { postDeckList } from '../services/deckService';

import { Deck } from '../Interface/deck';
import { Debounce } from '../utils/helpers';
import { fetchAllCards } from '../services/cardService';

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
  image_uris?: {
    small?: string;
    normal?: string;
  };
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

  useEffect(() => {
    fetchAllCards()
      .then((all) => setAllCards(all))
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleCreateDeck = async () => {
    console.log('=== Submitting Deck ===');

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

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      // Using Scryfall search endpoint for commander cards with images
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

      <Section>
        <Label>Deck Name</Label>
        <Input value={deckName} placeholder="Deck Name" onChange={handleChange(setDeckName)} />

        <Label>Format</Label>
        <Select value={format} onChange={handleFormatChange}>
          <option value="commander">Commander</option>
          <option value="standard">Standard</option>
          <option value="modern">Modern</option>
          <option value="legacy">Legacy</option>
          <option value="pauper">Pauper</option>
        </Select>
      </Section>

      {format === 'commander' && (
        <>
          <Label>Commander</Label>
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
                  {card.image_uris?.small && (
                    <img
                      src={card.image_uris.small}
                      alt={card.name}
                      style={{ width: '40px', marginRight: '10px', verticalAlign: 'middle' }}
                    />
                  )}
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
        </>
      )}

      <Section>
        <Label>Deck Cards (e.g. 4 Lightning Bolt)</Label>

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
      </Section>

      <Button name="Create Deck" onClick={handleCreateDeck} disabled={!deckName.trim()} />
    </Wrapper>
  );
};

export default Sandbox;

// Styled Components

const Wrapper = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  position: relative;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const Label = styled.h3`
  margin-bottom: 0.5rem;
  color: #333;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  font-family: monospace;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 0.5rem;
  resize: vertical;
`;

const SuggestionBox = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  position: absolute;
  width: calc(100% - 2rem);
  z-index: 100;
`;

const SuggestionItem = styled.li`
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #eee;
  }

  img {
    margin-right: 10px;
    border-radius: 3px;
  }
`;

const ErrorBox = styled.div`
  background-color: #ffe6e6;
  border: 1px solid #cc0000;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 6px;
  color: #a00000;

  ul {
    padding-left: 1.2rem;
    margin: 0;
  }

  h4 {
    margin-top: 0;
  }
`;

const CommanderImageWrapper = styled.div`
  margin-top: 1rem;

  img {
    max-width: 200px;
    border-radius: 8px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  }
`;
