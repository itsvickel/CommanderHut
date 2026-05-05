import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDeckListByID } from '../../services/deckService';

interface Card {
  id: string;
  name: string;
  mana_cost: string;
  type_line?: string;  // made optional because it might be missing
  image_url: string;
  oracle_text: string;
  image_uris?: { normal: string }; // fallback if using image_uris
}

interface CardWithCount extends Card {
  count: number;
}

interface DeckCard {
  card: Card;
  quantity: number;
}

const DeckList = () => {
  const { id } = useParams();
  const [deck, setDeck] = useState<any>(null);
  const [groupedCards, setGroupedCards] = useState<Record<string, CardWithCount[]>>({});
  const [filter, setFilter] = useState({ name: '', mana: '' });
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const groupByType = (deckCards: DeckCard[]) => {
    const groups: Record<string, CardWithCount[]> = {};
    const cardMap = new Map<string, CardWithCount>();

    deckCards.forEach(({ card, quantity }) => {
      const key = card.name;
      if (cardMap.has(key)) {
        cardMap.get(key)!.count += quantity;
      } else {
        cardMap.set(key, { ...card, count: quantity });
      }
    });

    cardMap.forEach((card) => {
      const typeLine = typeof card.type_line === 'string' ? card.type_line : "Unknown";
      const type = typeLine.split(' — ')[0].split(' ')[0];
      if (!groups[type]) groups[type] = [];
      groups[type].push(card);
    });

    setGroupedCards(groups);
  };

  useEffect(() => {
    if (id) {
      fetchDeckListByID(id as any)
        .then((deckData) => {
          console.log(deckData);
          setDeck(deckData);
          // pass the deckCards with card & quantity structure
          groupByType(deckData.cards || []);
        })
        .catch((err) => {
          console.error('Error fetching deck by ID:', err);
        });
    }
  }, [id]);


  const filterCards = (cards: CardWithCount[]) => {
    return cards.filter((card) => {
      const cardName = card.name || "";
      const filterName = filter.name || "";
      const cardMana = card.mana_cost || "";
      const filterMana = filter.mana || "";

      const matchesName = cardName.toLowerCase().includes(filterName.toLowerCase());
      const matchesMana = !filterMana || cardMana.includes(filterMana);

      return matchesName && matchesMana;
    });
  };

  if (!deck) return <div>Loading...</div>;

  return (
    <div className="p-8 w-[90vw] h-[80vh] mx-auto bg-[#f9f9f9] rounded-[10px]">
      <h2>{deck.deck_name}</h2>

      <div className="flex gap-4 my-6 justify-center">
        <input
          type="text"
          placeholder="Filter by name"
          value={filter.name}
          onChange={(e) => setFilter({ ...filter, name: e.target.value })}
          className="p-2 border border-[#ccc] rounded-md text-base w-[200px]"
        />
        <input
          type="text"
          placeholder="Filter by mana cost (e.g., {1}{G})"
          value={filter.mana}
          onChange={(e) => setFilter({ ...filter, mana: e.target.value })}
          className="p-2 border border-[#ccc] rounded-md text-base w-[200px]"
        />
      </div>

      <div>{/* You can add extra filter buttons here */}</div>

      <div>{/* Add download buttons or export options here */}</div>

      <div className="flex flex-wrap overflow-auto h-4/5 mx-[5%]">
        {Object.entries(groupedCards).map(([type, cards]) => (
          <div key={type} className="mb-8 flex-[25%]">
            <h3 className="border-b-2 border-[#ddd] pb-1 mb-2 text-left text-[1.2rem] text-[#333]">{type}</h3>
            <ul className="list-none pl-0 flex flex-col gap-1 text-left">
              {filterCards(cards).map((card) => (
                <li
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="relative p-2 cursor-pointer font-mono text-[#0077cc] hover:underline"
                >
                  <span className="font-bold mr-2">{card.count}x</span> {card.name}
                  <img
                    src={card?.image_uris?.normal}
                    alt={card.name}
                    className="hidden absolute top-[-10px] left-[250px] w-[200px] border border-[#ccc] rounded-lg bg-white z-10 [li:hover_&]:block"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/75 flex justify-center items-center z-[999]"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white p-8 rounded-2xl grid grid-cols-[auto_1fr] gap-8 max-w-[900px] max-h-[80vh] w-[90%] shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden animate-[fadeInScale_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-transparent border-none text-[1.75rem] text-[#888] cursor-pointer hover:text-[#222]"
              onClick={() => setSelectedCard(null)}
            >
              &times;
            </button>
            <img
              src={selectedCard?.image_uris?.normal}
              alt={selectedCard.name}
              className="h-auto max-h-[60vh] w-auto rounded-xl object-contain shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
            />
            <div className="flex flex-col overflow-y-auto">
              <h2 className="text-[1.75rem] m-0 mb-4 text-[#222]">{selectedCard.name}</h2>
              <p className="my-2 leading-relaxed text-[#444]"><strong className="text-black font-semibold">Mana Cost:</strong> {selectedCard.mana_cost}</p>
              <p className="my-2 leading-relaxed text-[#444]"><strong className="text-black font-semibold">Type:</strong> {selectedCard.type_line}</p>
              <p className="my-2 leading-relaxed text-[#444]"><strong className="text-black font-semibold">Text:</strong> {selectedCard.oracle_text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckList;
