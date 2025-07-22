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
  cardId: string;
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
  const isLoggedIn = !!user;

  const [deckName, setDeckName] = useState<string>('');
  const [deckCards, setDeckCards] = useState<string>(''); // Store as a string for editable text
  const [format, setFormat] = useState<string>('commander');
  const [commander, setCommander] = useState<string>('');
  const [commanderSuggestions, setCommanderSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const handleCreateDeck = async () => {
    const cardsArray = deckCards
      .split('\n')
      .map((line) => {
        const [count, ...cardNameParts] = line.trim().split(' ');
        const cardName = cardNameParts.join(' ').toLowerCase();
        return { name: cardName, count: parseInt(count) };
      })
      .filter(card => card.name && !isNaN(card.count));

    const cardNames = cardsArray.map(card => card.name); 

    try {
      const { cards: fetchedCards, notFound } = await fetchCardBulk(cardNames);

      if (!fetchedCards || fetchedCards.length === 0) {
        throw new Error('No cards were found or the API call failed');
      }

      const finalCards: { card_id: string; quantity: number }[] = [];
      const unresolved: string[] = [...(notFound || [])];

      cardsArray.forEach(card => {
        const matchedCard = fetchedCards.find((fetchedCard: Card) =>
          fetchedCard.name.toLowerCase() === card.name
        );
        if (matchedCard) {
          finalCards.push({
            card_id: matchedCard.id,
            quantity: card.count
          });
        } else if (!unresolved.includes(card.name)) {
          unresolved.push(card.name);
        }
      });

      if (unresolved.length > 0) {
        alert(`These cards could not be found: ${unresolved.join(', ')}`);
        return;
      }

      const ownerId = user?.id || 'anonymous';
      const deckPayload: Deck = {
        deck_name: deckName,
        format: format,
        deck_list: finalCards,
        commander: format.toLowerCase() === 'commander' ? commander : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: ownerId,
        tags: [],
        is_public: false,
      };

      const deckResponse = await postDeckList(deckPayload);
      alert('Deck created successfully!');
      console.log('Deck created:', deckResponse.data);
    } catch (err) {
      console.error(err);
      alert('Something went wrong while creating the deck.');
    }
  };

  const handleChange = (
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => (e: ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
  };

  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  const handleDeckNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDeckName(e.target.value);
  };

  const handleCommanderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommander(value);
    fetchCommanderSuggestions(value);
  };

  const fetchCommanderSuggestions = Debounce(async (query: string) => {
    if (!query.trim()) return;
  
    try {
      const response = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setCommanderSuggestions(data.data);
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
        <Label>Create a New Deck</Label>
        <Input
          placeholder="Deck Name"
          value={deckName}
          onChange={handleDeckNameChange}
        />
        <Label>Format</Label>
        <Select value={format} onChange={handleFormatChange}>
          <option value="commander">Commander</option>
          <option value="standard">Standard</option>
          <option value="modern">Modern</option>
          <option value="legacy">Legacy</option>
          <option value="pauper">Pauper</option>
          {/* Add more formats as needed */}
        </Select>
        {/* {format.toLowerCase() === 'commander' && (
          <Input
            placeholder="Add your Commander"
            value={commander}
            onChange={handleChange(setCommander)}
          />
        )} */}

        
      </Section>
      {format.toLowerCase() === 'commander' && (
        <>
          <Input
            placeholder="Add your Commander"
            value={commander}
            onChange={handleCommanderChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // close after click
            onFocus={() => commander && setShowSuggestions(true)}
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
        <Label>Advanced Options</Label>
        <DeckImport
          onImport={(cards) => {
            const cardCountMap: { [key: string]: number } = {};
            cards.forEach((card) => {
              const cardName = card.name.toLowerCase(); // normalize name (e.g., case insensitive)
              cardCountMap[cardName] = (cardCountMap[cardName] || 0) + 1;
            });

            const formattedCards = Object.entries(cardCountMap)
              .map(([cardName, count]) => `${count} ${cardName}`)
              .join('\n');

            setDeckCards(formattedCards);
          }}
        />

        {/* Display a large editable text area for the card list */}
        {deckCards && (
          <TextArea
            value={deckCards}
            onChange={handleChange(setDeckCards)}
            rows={10}
            placeholder="Edit your card list here..."
          />
        )}
      </Section>

      <Button
        name="Create Deck"
        onClick={handleCreateDeck}
        disabled={!deckName} // Disable button if deck name is empty
      />
    </Wrapper>
  );
};

export default Sandbox;

// Styled Components

const Wrapper = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const Label = styled.h3`
  margin-bottom: 1rem;
  color: #333;
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem;
  font-family: sans-serif;
  font-size: 1rem;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  font-family: monospace;
  font-size: 1rem;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
  margin-top: 1rem;
  min-height: 150px;
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