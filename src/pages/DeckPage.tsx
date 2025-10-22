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
        setDecks(res);
      })
      .catch((err) => {
        console.error('Error fetching decks:', err);
      });
  }, []);

  const navigateToDeckList = (id: string) => {
    navigate(`/decks/${id}`); // assuming route is like /deck/:id
  };

  return (
    <PageWrapper>
      <SectionTitle>Your Decks</SectionTitle>
      <DeckList>
        {decks.length === 0 ? (
          <NoDecks>No decks found. Create one!</NoDecks>
        ) : (
          decks.map((item) => (
            <DeckCard key={item._id} onClick={() => navigateToDeckList(item._id)}>
              <DeckCommanderImage
                src={item.commander_image || '/images/placeholder_commander.png'}
                alt={`${item.deck_name} Commander`}
              />
              <DeckInfo>
                <DeckTitle>{item.deck_name}</DeckTitle>
                <DeckDetails>
                  <DetailItem><strong>Owner:</strong> {item.owner_email || 'Anonymous'}</DetailItem>
                  <DetailItem>
                    <strong>Last Updated:</strong> {new Date(item.updated_at).toLocaleDateString()}
                  </DetailItem>
                </DeckDetails>
              </DeckInfo>
            </DeckCard>
          ))
        )}
      </DeckList>
    </PageWrapper>
  );
};

export default DeckPage;

// ========== Styled Components ==========

const PageWrapper = styled.div`
  width: 90%;
  max-width: 960px;
  margin: 3rem auto;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 2.5rem;
  text-align: center;
  color: #222;
  font-weight: 700;
`;

const DeckList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  overflow-y: scroll;
  max-height: 70vh;
`;

const NoDecks = styled.p`
  font-size: 1.2rem;
  text-align: center;
  color: #666;
  grid-column: 1 / -1;
`;
const DeckCard = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const DeckCommanderImage = styled.img`
  width: 160px;          // smaller width
  height: 224px;         // standard Magic card aspect ratio (approx 63mm x 88mm scaled)
  object-fit: cover;
  border-radius: 12px 12px 0 0;
  margin: 0 auto 1rem;   // center horizontally and some bottom margin
  background-color: #f9f9f9;
  transition: transform 0.5s ease;
  will-change: transform;
`;

const DeckInfo = styled.div`
  padding: 1rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const DeckTitle = styled.h3`
  font-size: 1.6rem;
  margin-bottom: 0.75rem;
  color: #111;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeckDetails = styled.div`
  margin-top: auto;
  color: #555;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailItem = styled.span`
  font-weight: 500;
  color: #666;
`;
