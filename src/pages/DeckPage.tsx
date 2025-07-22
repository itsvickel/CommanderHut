import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { fetchAllDecks } from '../services/deckService';
import { useNavigate } from 'react-router-dom';

const DeckPage = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllDecks()
      .then((res) => {
        setDecks(res.decks);
      })
      .catch((err) => {
        console.error('Error fetching decks:', err);
      });
  }, []);

  const navigateToDeckList = (ID: number) => {
    navigate(ID);
  }

  const displayDeckList = () => {
    return decks?.map((item, index) => (
      <DeckCard onClick={() => navigateToDeckList(item.id)} key={index}>
        <DeckTitle>{item.deck_name}</DeckTitle>
        <DeckDetails>
          <span>Owner: {item.owner_email}</span>
          <span>Last updated: {new Date(item.updated_at).toLocaleDateString()}</span>
        </DeckDetails>
      </DeckCard>
    ));
  };

  return (
    <PageWrapper>
      <SectionTitle>Your Decks</SectionTitle>
      <DeckList>{displayDeckList()}</DeckList>
    </PageWrapper>
  );
};

export default DeckPage;

// ========== Styled Components ==========

const PageWrapper = styled.div`
  width: 90%;
  max-width: 800px;
  margin: 3rem auto;
  padding: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const DeckList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const DeckCard = styled.div`
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #ccc;
  background-color: #fefefe;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.01);
    border-color: #888;
  }
`;

const DeckTitle = styled.h3`
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
`;

const DeckDetails = styled.div`
  display: flex;
  flex-direction: column;
  color: #666;
  font-size: 0.95rem;
  gap: 0.25rem;
`;
