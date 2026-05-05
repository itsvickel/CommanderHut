import React, { useCallback, useEffect, useState } from 'react';
import { fetchCardByName, fetchListOfRandomCards } from '../services/cardService';
import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';
import CardItem from '../Components/Card/CardItem';

interface Card {
  name: string;
  image_uris: { normal: string };
  oracle_text: string;
}

const CardPage = () => {
  const [listOfCards, setListOfCards] = useState<Card[]>([]);
  const [cardInput, setCardInput] = useState<string>('');
  const [searchedCards, setSearchedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const random = await fetchListOfRandomCards(20);
      setListOfCards(random);
    } catch {
      setError('Failed to load cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRandom();
  }, [loadRandom]);

  const searchCardByName = () => {
    if (!cardInput.trim()) return;
    fetchCardByName(cardInput)
      .then((item) => setSearchedCards(item))
      .catch(() => setError('Search failed.'));
    setCardInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') searchCardByName();
  };

  const displayListofCards = (cards: Card[]) =>
    cards.map((card, index) => <CardItem key={index} obj={card} />);

  if (loading) return <Spinner label="Loading cards" />;
  if (error) return <ErrorState message={error} retry={loadRandom} />;

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl mb-8">
        <h1 className="font-semibold text-center mb-6 text-gray-900 dark:text-gray-100" style={{ fontSize: '1.8rem' }}>
          Magic: The Gathering Cards
        </h1>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Input
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by card name..."
            />
          </div>
          <Button onClick={searchCardByName} name="Search" />
        </div>
      </div>

      <div
        className="w-full grid gap-2 justify-items-center pb-8 overflow-y-auto"
        style={{
          maxWidth: '90vw',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          maxHeight: '60vh',
        }}
      >
        {searchedCards.length > 0
          ? displayListofCards(searchedCards)
          : displayListofCards(listOfCards)}
      </div>
    </div>
  );
};

export default CardPage;
