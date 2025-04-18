import React, { useState } from 'react';
import styled from 'styled-components';
import API_ENDPOINT from '../../Constants/api';
import SearchBar from '../UI_Components/Searchbar';
import { fetchCardByName } from '../../services/cardService';
import { Card } from '../../Interface';

import CardItem from '../Card/CardItem';

// Define the Props interface outside the component for better readability
interface DeckProps {
  key?: number;
  obj?: {
    name?: string;
    image_uris?: {
      normal: string;
    };
    oracle_text?: string;
  };
}

// Function to group cards by their type
const groupCardsByType = (cards: Card[]) => {
  return cards.reduce((acc: Record<string, Card[]>, card) => {
    const type = card.type_line?.split(' — ')[0] || 'Other'; // Default to 'Other' if no type is available
    if (!acc[type]) acc[type] = [];
    acc[type].push(card);
    return acc;
  }, {});
};

const CustomDeck = ({ obj, key }: DeckProps) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const fetchOptions = async (query: string) => {
    return await fetchCardByName(query);
  };

  const handleSelect = (card: any) => {
    if (card) {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  // Group the selected cards by their type
  const groupedCards = groupCardsByType(selectedCards);

  return (
    <Wrapper key={key}>
      <SearchBar fetchOptions={fetchOptions} onSelect={handleSelect} />

      <StackContainer>
        {Object.entries(groupedCards).map(([type, cards]) => (
          <CardGroup key={type}>
            <GroupTitle>{type}</GroupTitle>
            <CardList>
              {cards.map((card, i) => (
                <CardItem
                key={i}
                obj={card}
                />
              ))}
            </CardList>
          </CardGroup>
        ))}
      </StackContainer>
    </Wrapper>
  );
};

export default CustomDeck;

const Wrapper = styled.div`
 
`;

const StackContainer = styled.div`
  margin-top: 2rem;
`;

const CardGroup = styled.div`
  margin-bottom: 2rem;
`;

const GroupTitle = styled.h3`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const CardList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;
 
