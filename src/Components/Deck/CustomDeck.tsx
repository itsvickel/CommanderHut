import { useState } from 'react';
import SearchBar from '../UI_Components/Searchbar';
import { fetchCardByName } from '../../services/cardService';
import { Card } from '../../Interface/index';

import CardItem from '../Card/CardItem';
import { Button, Input } from '../UI_Components/index';

import DeckFormat from '../../Constants/constant';

import { postDeckList } from '../../services/deckService';

import { useSelector } from 'react-redux';

interface RootState {
  auth: { user: any };
}

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
    postDeckList({ email_address: user?.email_address, deck_name: deckName, format: DeckFormat.Commander, cards: selectedCards }).then((res) => {
      if (res) {
        setSelectedCards([]);
        setDeckName('');
      }
    });

  }

  // Group the selected cards by their type
  const groupedCards = groupCardsByType(selectedCards);

  return (
    <div key={key}>
      <SearchBar fetchOptions={fetchOptions} onSelect={handleSelect} />

      <Input placeholder='deck name' onChange={(e) => setDeckName(e.target.value)} />
      <div className="mt-8">
        {groupedCards ?
          <>
            {Object.entries(groupedCards).map(([type, cards]) => (
              <div key={type} className="mb-8">
                <h3 className="font-bold mb-2">{type}</h3>
                <div className="flex flex-wrap gap-2.5">
                  {cards.map((card, i) => (
                    <CardItem
                      key={i}
                      obj={card}
                    />
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={SubmitDeck} name={'Submit'} />
          </>
          : null}
      </div>
    </div>
  );
};

export default CustomDeck;
