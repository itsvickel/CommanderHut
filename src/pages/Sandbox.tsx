import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import DeckImport from '../Components/Deck/DeckImport';
import { fetchCardBulk } from '../services/cardService';
import { postDeckList } from '../services/deckService';

import { Deck } from '../Interface/deck';
import { Debounce } from '../utils/helpers';

interface SelectedCard {
  card: string;
  quantity: number;
}

interface RootState {
  auth: {
    user: {
      id: string;
      email: string;
    } | null;
  };
}

const Sandbox: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState('');
  const [format, setFormat] = useState('commander');
  const [commander, setCommander] = useState('');
  const [commanderSuggestions, setCommanderSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorCards, setErrorCards] = useState<string[]>([]);

  const handleCreateDeck = async () => {
    console.log('=== Submitting Deck ===');
    console.log('Deck name:', deckName);
    console.log('Commander:', commander);
    console.log('Deck cards raw input:', deckCards);

    // Parse deckCards text into structured array [{name, count}]
    const cardsArray = deckCards
      .split('\n')
      .map(line => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match) return null;
        const [, count, name] = match;
        return { name: name.trim(), count: parseInt(count, 10) };
      })
      .filter(Boolean) as { name: string; count: number }[];

    console.log('Parsed cardsArray:', cardsArray);

    if (cardsArray.length === 0) {
      alert('Your deck list is empty or incorrectly formatted. Use lines like "4 Lightning Bolt".');
      return;
    }

    const cardNames = cardsArray.map(c => c.name);
    console.log('Card names for fetch:', cardNames);

    try {
      const { cards: fetchedCards, notFound } = await fetchCardBulk(cardNames);

      console.log('Fetched cards from backend:', fetchedCards);
      console.log('Cards not found:', notFound);

      const finalCards: SelectedCard[] = [];

      cardsArray.forEach(inputCard => {
        const match = fetchedCards.find(c =>
          c.name.trim().toLowerCase() === inputCard.name.trim().toLowerCase()
        );
        if (match?.id) {
          finalCards.push({ card: match.id, quantity: inputCard.count });
        } else {
          console.warn('Card not found in fetched cards:', inputCard.name);
        }
      });

      if (notFound?.length) {
        setErrorCards(notFound);
        alert('Unresolved cards: ' + notFound.join(', '));
        return;
      } else {
        setErrorCards([]);
      }

      const payload: Deck = {
        deck_name: deckName,
        format,
        commander: format === 'commander' ? commander : undefined,
        deck_list: finalCards,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: user?.id || 'anonymous',
        tags: [],
        is_public: false,
      };

      console.log('Payload to submit:', payload);

      await postDeckList(payload);

      alert('Deck submitted successfully!');
      // Reset all fields after successful submit
      setDeckName('');
      setDeckCards('');
      setCommander('');
      setCommanderSuggestions([]);
      setShowSuggestions(false);
      setErrorCards([]);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit deck.');
    }
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
    };

  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  const handleCommanderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommander(value);
    fetchCommanderSuggestions(value);
  };

  const fetchCommanderSuggestions = Debounce(async (query: string) => {
    if (!query.trim()) {
      setCommanderSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCommanderSuggestions(data.data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Autocomplete error:", err);
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
              {commanderSuggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion}
                  onClick={() => {
                    setCommander(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </SuggestionItem>
              ))}
            </SuggestionBox>
          )}
        </>
      )}

      <Section>
        <Label>Deck Cards (e.g. 4 Lightning Bolt)</Label>
        <DeckImport
          onImport={(cards) => {
            // Count duplicates properly
            const counts: Record<string, number> = {};
            cards.forEach(card => {
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
          <ErrorCardsContainer>
            <strong>Unresolved cards:</strong>
            {errorCards.map(card => <div key={card}>{card}</div>)}
          </ErrorCardsContainer>
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
  &:hover {
    background-color: #eee;
  }
`;

const ErrorCardsContainer = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  border: 1px solid red;
  background-color: #fee;
  color: #900;
`;
