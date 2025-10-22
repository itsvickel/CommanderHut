import React, { useState } from 'react';
import styled from 'styled-components';
import API_ENDPOINT from '../../Constants/api';
import SearchBar from '../UI_Components/Searchbar';
import { fetchCardByName } from '../../services/cardService';
import { Card } from '../../Interface/index';

import CardItem from '../Card/CardItem';
import { Button, Input } from '../UI_Components/index';

import DeckFormat from '../../Constants/constant';

import { postDeckList } from '../../services/deckService';

import { useSelector } from 'react-redux';

// Define the Props interface outside the component for better readability
interface DeckProps {
  key?: number;
  card?: Card[];
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

const CustomDeck = ({ card, key }: DeckProps) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>(card || []);
  const [deckName, setDeckName] = useState<string>("");

  const user = useSelector((state: RootState) => state.auth.user);


  const fetchOptions = async (query: string) => {
    return await fetchCardByName(query);
  };

  const handleSelect = (card: any) => {
    if (card) {
      setSelectedCards(prev => [...prev, card]);
    }
  };

  const SubmitDeck = () => {

    // email_address,
    // deck_name,
    // format,
    // commander,
    // tags,
    // is_public,
    // cards: selectedCards, 
    console.log(selectedCards);
    postDeckList(user.email_address, deckName, DeckFormat.Commander, selectedCards).then((res) => {
      if (res) {
        setSelectedCards([]);
        setDeckName('');
      }
    });

  }

  // Group the selected cards by their type
  const groupedCards = groupCardsByType(selectedCards);

  return (
    <Wrapper key={key}>
      <SearchBar fetchOptions={fetchOptions} onSelect={handleSelect} />

      <Input placeholder='deck name' onChange={(e) => setDeckName(e.target.value)} />
      <StackContainer>
        {groupedCards ?
          <>
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
            <Button onClick={SubmitDeck} name={'Submit'} />
          </>
          : null}
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

