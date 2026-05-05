import React, { useState, ChangeEvent } from 'react';
import { useSelector } from 'react-redux';

import Button from '../Components/UI_Components/Button';
import Input from '../Components/UI_Components/Input';
import DeckImport from '../Components/Deck/DeckImport';
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

interface CommanderCard {
  name: string;
  image_uris?: { small?: string; normal?: string };
  id: string;
}

const formatMap: Record<string, string> = {
  commander: 'Commander',
  standard: 'Standard',
  modern: 'Modern',
  legacy: 'Legacy',
  pauper: 'Pauper',
};

const Sandbox: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState('');
  const [format, setFormat] = useState('commander');
  const [commander, setCommander] = useState('');
  const [commanderSuggestions, setCommanderSuggestions] = useState<CommanderCard[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCommanderImage, setSelectedCommanderImage] = useState<string | null>(null);
  const [errorCards, setErrorCards] = useState<string[]>([]);

  const [openSection, setOpenSection] = useState<string>('Deck Name'); // only one open at a time

  const handleCreateDeck = async () => {
    const parsedCards = deckCards
      .split('\n')
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match) return null;
        const [, count, name] = match;
        return { name: name.trim(), count: parseInt(count, 10) };
      })
      .filter(Boolean) as { name: string; count: number }[];

    if (parsedCards.length === 0) {
      alert('Deck list is empty or incorrectly formatted.');
      return;
    }

    try {
      const deck_list = parsedCards.map(({ name, count }) => ({
        card: name,
        quantity: count,
      }));

      const payload: Deck = {
        deck_name: deckName,
        format: formatMap[format.toLowerCase()] || 'Commander',
        commander: format === 'commander' ? commander : undefined,
        commander_image: format === 'commander' ? selectedCommanderImage || undefined : undefined,
        deck_list,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: user ? user?.id : 'anonymous',
        tags: [],
        is_public: false,
      };

      const res = await postDeckList(payload);

      if (res?.notFound?.length > 0) {
        setErrorCards(res.notFound);
        alert('Some cards could not be found.');
        return;
      }

      alert('Deck submitted successfully!');
      setDeckName('');
      setDeckCards('');
      setCommander('');
      setCommanderSuggestions([]);
      setShowSuggestions(false);
      setSelectedCommanderImage(null);
      setErrorCards([]);
    } catch (err: any) {
      console.log('Deck submit error:', err);
      if (err?.details?.notFound?.length > 0) {
        setErrorCards(err.details.notFound);
        alert('Some cards could not be found.');
      } else {
        alert('Failed to submit deck.');
      }
    }
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setter(e.target.value);
      };

  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  const handleCommanderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommander(value);
    setSelectedCommanderImage(null);
    fetchCommanderSuggestions(value);
  };

  const fetchCommanderSuggestions = Debounce(async (query: string) => {
    if (!query.trim()) {
      setCommanderSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}+is:commander&unique=prints`
      );
      const data = await res.json();

      if (data.object !== 'error') {
        const results = data.data.map((card: any) => ({
          name: card.name,
          image_uris: card.image_uris,
          id: card.id,
        }));
        setCommanderSuggestions(results);
        setShowSuggestions(true);
      } else {
        setCommanderSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      setCommanderSuggestions([]);
    }
  }, 300);

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
        Deck Builder
      </h1>

      <div className="overflow-y-auto h-full">
        <CollapsibleSection
          title="Deck Name"
          value={deckName}
          isOpen={openSection === 'Deck Name'}
          setOpenSection={setOpenSection}
        >
          <Input value={deckName} placeholder="Deck Name" onChange={handleChange(setDeckName)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Format"
          value={formatMap[format]}
          isOpen={openSection === 'Format'}
          setOpenSection={setOpenSection}
        >
          <select
            value={format}
            onChange={handleFormatChange}
            className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-600 focus:outline-none"
          >
            <option value="commander">Commander</option>
            <option value="standard">Standard</option>
            <option value="modern">Modern</option>
            <option value="legacy">Legacy</option>
            <option value="pauper">Pauper</option>
          </select>
        </CollapsibleSection>

        {format === 'commander' && (
          <CollapsibleSection
            title="Commander"
            value={commander || undefined}
            isOpen={openSection === 'Commander'}
            setOpenSection={setOpenSection}
          >
            <Input
              value={commander}
              onChange={handleCommanderChange}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
              onFocus={() => commander && setShowSuggestions(true)}
              placeholder="Add your Commander"
            />
            {showSuggestions && commanderSuggestions.length > 0 && (
              <ul className="list-none m-0 p-2 border border-gray-300 dark:border-gray-700 border-t-0 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 absolute z-50 rounded-b-lg" style={{ width: 'calc(100% - 2rem)' }}>
                {commanderSuggestions.map((card) => (
                  <li
                    key={card.id}
                    onClick={() => {
                      setCommander(card.name);
                      setSelectedCommanderImage(card.image_uris?.normal || null);
                      setShowSuggestions(false);
                    }}
                    className="px-3 py-2 cursor-pointer flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {card.image_uris?.small && (
                      <img src={card.image_uris.small} alt={card.name} className="w-10 mr-2 rounded" />
                    )}
                    {card.name}
                  </li>
                ))}
              </ul>
            )}
            {selectedCommanderImage && (
              <div className="mt-4 text-center">
                <img
                  src={selectedCommanderImage}
                  alt="Selected Commander"
                  className="max-w-xs rounded-2xl shadow-xl inline-block"
                  style={{ maxWidth: '240px' }}
                />
              </div>
            )}
          </CollapsibleSection>
        )}

        <CollapsibleSection
          title="Deck Cards"
          hideSummary
          isOpen={openSection === 'Deck Cards'}
          setOpenSection={setOpenSection}
        >
          <DeckImport
            onImport={(cards) => {
              const counts: Record<string, number> = {};
              cards.forEach((card) => {
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
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 p-4 my-4 rounded-lg text-red-800 dark:text-red-200">
              <h4>The following cards were not found:</h4>
              <ul>
                {errorCards.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            rows={10}
            value={deckCards}
            onChange={handleChange(setDeckCards)}
            placeholder="Enter cards one per line, e.g. '4 Lightning Bolt'"
            className="w-full p-4 font-mono text-base border border-gray-300 dark:border-gray-700 rounded-lg mt-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
          />
        </CollapsibleSection>

      </div>

      <Button name="Create Deck" onClick={handleCreateDeck} disabled={!deckName.trim()} />
    </div>
  );
};

export default Sandbox;

/* ---------------- Collapsible Section Component ---------------- */
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  value?: string | null;
  hideSummary?: boolean;
  isOpen: boolean;
  setOpenSection: (title: string) => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  value,
  hideSummary,
  isOpen,
  setOpenSection,
}) => {
  const handleToggle = () => setOpenSection(isOpen ? '' : title);

  return (
    <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className="bg-gray-100 dark:bg-gray-700 px-4 py-3 font-semibold cursor-pointer flex justify-between items-center hover:bg-gray-200 dark:hover:bg-gray-600"
        onClick={handleToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {title}
          {!isOpen && !hideSummary && value && (
            <span style={{ color: '#10b981', fontWeight: 500 }}>✔ {value}</span>
          )}
        </div>
        <span
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            display: 'inline-block',
          }}
        >
          ▶
        </span>
      </div>
      <div
        style={{
          maxHeight: isOpen ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          padding: isOpen ? '1rem' : '0 1rem',
        }}
      >
        {children}
      </div>
    </div>
  );
};
