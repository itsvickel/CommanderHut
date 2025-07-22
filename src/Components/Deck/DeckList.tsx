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
  image_uris?: { normal: string }; // fallback if using image_uris
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
          groupByType(deckData.deck.card_list);
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

      <Filters>
        {/* buttons -> mana value, name,  */}
      </Filters>


      <Download>
        {/* buttons -> mana value, name,  */}
      </Download>


      <CardContainer>
        {Object.entries(groupedCards).map(([type, cards]) => (
          <TypeSection key={type}>
            <h3>{type}</h3>
            <TextList>
              {filterCards(cards).map((card) => (
                <CardRow key={card.id} onClick={() => setSelectedCard(card)}>
                  <span>{card.count}x</span> {card.name}
                  <HoverImage src={card?.image_uris?.normal} alt={card.name} />
                </CardRow>
              ))}
            </TextList>
          </TypeSection>
        ))}
      </CardContainer>

      {selectedCard && (
        <CardModal onClick={() => setSelectedCard(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setSelectedCard(null)}>&times;</CloseButton>
            <img src={selectedCard?.image_uris?.normal} alt={selectedCard.name} />
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

// ---------- STYLED COMPONENTS ----------

const Wrapper = styled.div`
  padding: 2rem;
  width: 90vw;
  height: 80vh;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 10px;
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

const CardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  overflow: auto;
  height: 80%;
  margin: 2% 5%;
`;

const TypeSection = styled.div`

  margin-bottom: 2rem;
  flex: 25%;
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
  padding: 2rem;
  border-radius: 16px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  max-width: 900px;
  max-height: 80vh;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: fadeInScale 0.3s ease;

  img {
    height: auto;
    max-height: 60vh;
    width: auto;
    border-radius: 12px;
    object-fit: contain;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  h2 {
    font-size: 1.75rem;
    margin: 0 0 1rem;
    color: #222;
  }

  p {
    margin: 0.5rem 0;
    line-height: 1.6;
    color: #444;
  }

  strong {
    color: #000;
    font-weight: 600;
  }

  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.75rem;
  color: #888;
  cursor: pointer;

  &:hover {
    color: #222;
  }
`;

const Filters = styled.div`

`;

const Download = styled.div`
  
`;