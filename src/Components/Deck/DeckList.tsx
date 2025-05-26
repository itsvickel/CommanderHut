import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { fetchDeckListByID } from '../../services/deckService';

interface Card {
  id: string;
  name: string;
  mana_cost: string;
  type_line: string;
  image_url: string;
  oracle_text: string;
}

interface CardWithCount extends Card {
  count: number;
}

const DeckList = () => {
  const { id } = useParams();
  const [deck, setDeck] = useState<any>(null);
  const [groupedCards, setGroupedCards] = useState<Record<string, CardWithCount[]>>({});
  const [filter, setFilter] = useState({ name: '', mana: '' });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Move groupByType function outside of useEffect
  const groupByType = (cards: Card[]) => {
    const groups: Record<string, CardWithCount[]> = {};
    const cardMap = new Map<string, CardWithCount>();

    cards.forEach((card) => {
      const key = card.name;
      if (cardMap.has(key)) {
        cardMap.get(key)!.count += 1;
      } else {
        cardMap.set(key, { ...card, count: 1 });
      }
    });

    cardMap.forEach((card) => {
      const type = card.type_line.split(' — ')[0].split(' ')[0];
      if (!groups[type]) groups[type] = [];
      groups[type].push(card);
    });

    setGroupedCards(groups);
  };

  useEffect(() => {
    if (id) {
      fetchDeckListByID(id)
        .then((deckData) => {
          setDeck(deckData.deck);
          groupByType(deckData.deck.card_list);  // Call groupByType after setting the deck data
        })
        .catch((err) => {
          console.error('Error fetching deck by ID:', err);
        });
    }
  }, [id]);

  const filterCards = (cards: Card[]) => {
    return cards.filter((card) => {
      const matchesName = card.name.toLowerCase().includes(filter.name.toLowerCase());
      const matchesMana =
        !filter.mana || (card.mana_cost && card.mana_cost.includes(filter.mana));
      return matchesName && matchesMana;
    });
  };

  if (!deck) return <div>Loading...</div>;

  return (
    <Wrapper>
      <h2>{deck.deck_name}</h2>

      <FilterBar>
        <input
          type="text"
          placeholder="Filter by name"
          value={filter.name}
          onChange={(e) => setFilter({ ...filter, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by mana cost (e.g., {1}{G})"
          value={filter.mana}
          onChange={(e) => setFilter({ ...filter, mana: e.target.value })}
        />
      </FilterBar>

      {Object.entries(groupedCards).map(([type, cards]) => (
        <TypeSection key={type}>
          <h3>{type}</h3>
          <TextList>
            {filterCards(cards).map((card) => (
              <CardRow key={card.id} onClick={() => setSelectedCard(card)}>
                <span>{card.count}x</span> {card.name}
                <HoverImage src={card.image_url} alt={card.name} />
              </CardRow>
            ))}
          </TextList>
        </TypeSection>
      ))}

      {selectedCard && (
        <CardModal onClick={() => setSelectedCard(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <img src={selectedCard.image_url} alt={selectedCard.name} />
            <CardInfo>
              <h2>{selectedCard.name}</h2>
              <p><strong>Mana Cost:</strong> {selectedCard.mana_cost}</p>
              <p><strong>Type:</strong> {selectedCard.type_line}</p>
              <p><strong>Text:</strong> {selectedCard.oracle_text}</p>
            </CardInfo>
          </ModalContent>
        </CardModal>
      )}
    </Wrapper>
  );
};

export default DeckList;

const Wrapper = styled.div`
  padding: 2rem;
  width: 90vw;
  height: 80vh;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 10px;
`;

const CardHover = styled.li`
  padding: 0.5rem;
  cursor: pointer;
  font-family: monospace;
  color: #0077cc;

  &:hover {
    text-decoration: underline;
  }
`;

const CardModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  gap: 1.5rem;
  max-width: 800px;

  img {
    height: 400px;
    border-radius: 8px;
  }
`;

const CardInfo = styled.div`
  max-width: 350px;
  h2 {
    margin: 0 0 0.5rem;
  }
  p {
    margin: 0.5rem 0;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
  justify-content: center;

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    width: 200px;
  }
`;

const TypeSection = styled.div`
  margin-bottom: 2rem;

  h3 {
    border-bottom: 2px solid #ddd;
    padding-bottom: 0.25rem;
    margin-bottom: 0.5rem;
    text-align: left;
    font-size: 1.2rem;
    color: #333;
  }
`;

const TextList = styled.ul`
  list-style: none;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
`;

const CardRow = styled.li`
  position: relative;
  padding: 0.5rem;
  cursor: pointer;
  font-family: monospace;
  color: #0077cc;

  &:hover {
    text-decoration: underline;
  }

  &:hover img {
    display: block;
  }

  span {
    font-weight: bold;
    margin-right: 0.5rem;
  }
`;

const HoverImage = styled.img`
  display: none;
  position: absolute;
  top: -10px;
  left: 250px;
  width: 200px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: white;
  z-index: 10;
`;
