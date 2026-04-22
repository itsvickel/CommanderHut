import { useState } from 'react';
import styled from 'styled-components';
import { fetchCardByName } from '../services/cardService';
import { fetchMTGIdea } from '../services/aiService';
import Spinner from '../Components/UI_Components/Spinner';
import ErrorState from '../Components/UI_Components/ErrorState';

const AIGenerate = () => {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<object[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawAIText, setRawAIText] = useState('');

  const handleGenerateCards = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setCards([]);
    setRawAIText('');

    try {
      const aiText = await fetchMTGIdea(query);
      setRawAIText(aiText);

      const cardNameMatches = [...aiText.matchAll(/\*\*(.+?)\*\*/g)];
      const cardNames = cardNameMatches.map((m) => m[1]);

      if (cardNames.length === 0) {
        setError('No card names were found in the AI response.');
        return;
      }

      for (const name of cardNames) {
        try {
          const res = await fetchCardByName(name);
          if (res) setCards((prev) => [...prev, res]);
        } catch (cardErr) {
          console.warn(`Could not fetch card: ${name}`, cardErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>AI-Generated MTG Cards</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask the AI to generate card ideas..."
      />

      <button onClick={handleGenerateCards} disabled={loading}>
        Generate Cards
      </button>

      {loading && <Spinner label="Generating cards" />}
      {error && !loading && <ErrorState message={error} retry={handleGenerateCards} />}

      {!loading && rawAIText && (
        <RawTextContainer>{rawAIText}</RawTextContainer>
      )}

      {!loading && cards.length > 0 && (
        <Column>
          {cards.map((item: any, index) => (
            <Card key={index}>
              <img src={item?.image_uris?.normal} alt={item?.name} />
              <p>{item?.name}</p>
            </Card>
          ))}
        </Column>
      )}
    </Container>
  );
};

export default AIGenerate;

const Container = styled.div`
  max-width: auto;
  margin: 2rem auto;
  padding: 1rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 5px #ccc;
  input {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1rem;
  }
  button {
    width: 100%;
    padding: 0.7rem;
    background-color: #2563eb;
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    &:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
    }
  }
`;

const Column = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: auto;
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  img { width: 80px; border-radius: 8px; }
  p { font-weight: 600; }
`;

const RawTextContainer = styled.div`
  height: 40vh;
  width: 50vw;
  font-weight: bold;
  font-size: 1.5em;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  max-height: 40vh;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  color: #111827;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;
