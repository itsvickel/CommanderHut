import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import DeckImport from '../Components/Deck/DeckImport';
import { fetchCardBulk, fetchCardByName } from '../services/cardService';
import { postDeckList } from '../services/deckService';

import { Deck } from '../Interface/deck';
import { Debounce } from '../utils/helpers';

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

  const [deckName, setDeckName] = useState<string>('');
  const [deckCards, setDeckCards] = useState<string>('');
  const [format, setFormat] = useState<string>('commander');
  const [commander, setCommander] = useState<string>('');
  const [commanderSuggestions, setCommanderSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isBasicLand = (name: string, type_line?: string) => {
    const basicNames = new Set([
      'plains', 'island', 'swamp', 'mountain', 'forest', 'wastes',
      'snow-covered plains', 'snow-covered island', 'snow-covered swamp', 'snow-covered mountain', 'snow-covered forest'
    ]);
    if (type_line && type_line.toLowerCase().includes('basic land')) return true;
    return basicNames.has(name.toLowerCase());
  };

  const getCommanderColors = async (commanderName: string): Promise<Set<string>> => {
    try {
      const results: any[] = await fetchCardByName(commanderName);
      const cmd = results && results.length > 0 ? results[0] : null;
      const colors: string[] = (cmd?.color_identity || cmd?.colors || []) as string[];
      return new Set(colors.map(c => c.toUpperCase()));
    } catch {
      return new Set<string>();
    }
  };

  const validateCommanderDeck = async (
    selectedCardsDetailed: { meta: any; quantity: number }[],
    commanderName: string
  ): Promise<string[]> => {
    const errors: string[] = [];

    if (!commanderName.trim()) {
      errors.push('Commander is required for Commander format.');
      return errors;
    }

    // 99 cards in deck list (commander separate)
    const totalCount = selectedCardsDetailed.reduce((sum, c) => sum + c.quantity, 0);
    if (totalCount !== 99) {
      errors.push(`Commander decks must have exactly 99 cards (excluding commander). Current: ${totalCount}.`);
    }

    // Singleton rule (except basic lands)
    selectedCardsDetailed.forEach(({ meta, quantity }) => {
      const name = meta?.name || '';
      const type_line = meta?.type_line || '';
      if (quantity > 1 && !isBasicLand(name, type_line)) {
        errors.push(`Non-singleton card detected: ${name} x${quantity}`);
      }
    });

    // Color identity
    const commanderColors = await getCommanderColors(commanderName);
    if (commanderColors.size === 0) {
      errors.push('Could not determine commander color identity.');
      return errors;
    }
    const allowed = new Set(Array.from(commanderColors));
    const offColorCards: string[] = [];

    selectedCardsDetailed.forEach(({ meta }) => {
      const colors: string[] = (meta?.color_identity || meta?.colors || []).map((c: string) => c.toUpperCase());
      const legal = colors.every((c: string) => allowed.has(c));
      if (!legal) {
        offColorCards.push(meta?.name || 'Unknown Card');
      }
    });

    if (offColorCards.length > 0) {
      errors.push(`Cards outside commander color identity: ${offColorCards.slice(0, 10).join(', ')}${offColorCards.length > 10 ? '…' : ''}`);
    }

    return errors;
  };

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
      const fetchedCards: any[] = await fetchCardBulk(cardNames);

      if (!fetchedCards || fetchedCards.length === 0) {
        throw new Error('No cards were found or the API call failed');
      }

      const selectedCardsDetailed: { meta: any; quantity: number }[] = [];
      const finalCards: { id: number; quantity: number }[] = [];
      const unresolved: string[] = [];

      cardsArray.forEach(card => {
        const matchedCard = fetchedCards.find((fetchedCard: any) =>
          (fetchedCard.name || '').toLowerCase() === card.name
        );
        if (matchedCard) {
          selectedCardsDetailed.push({ meta: matchedCard, quantity: card.count });
          finalCards.push({ id: Number(matchedCard.id), quantity: card.count });
        } else if (!unresolved.includes(card.name)) {
          unresolved.push(card.name);
        }
      });

      if (unresolved.length > 0) {
        setValidationErrors([`These cards could not be found: ${unresolved.join(', ')}`]);
        alert(`These cards could not be found: ${unresolved.join(', ')}`);
        return;
      }

      // Commander validation when applicable
      if (format.toLowerCase() === 'commander') {
        const errors = await validateCommanderDeck(selectedCardsDetailed, commander);
        setValidationErrors(errors);
        if (errors.length > 0) {
          return;
        }
      } else {
        setValidationErrors([]);
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
        </Select>
      </Section>
      {format.toLowerCase() === 'commander' && (
        <>
          <Input
            placeholder="Add your Commander"
            value={commander}
            onChange={handleCommanderChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
              const cardName = card.name.toLowerCase();
              cardCountMap[cardName] = (cardCountMap[cardName] || 0) + 1;
            });

            const formattedCards = Object.entries(cardCountMap)
              .map(([cardName, count]) => `${count} ${cardName}`)
              .join('\n');

            setDeckCards(formattedCards);
          }}
        />

        {deckCards && (
          <TextArea
            value={deckCards}
            onChange={handleChange(setDeckCards)}
            rows={10}
            placeholder="Edit your card list here..."
          />
        )}
      </Section>

      {validationErrors.length > 0 && (
        <ValidationBox>
          <strong>Deck checks failed:</strong>
          <ul>
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </ValidationBox>
      )}

      <Button
        name="Create Deck"
        onClick={handleCreateDeck}
        disabled={!deckName}
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

const ValidationBox = styled.div`
  background: #fff6f6;
  border: 1px solid #f5c2c2;
  color: #a33;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;