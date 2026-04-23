// src/Components/Decksmith/DeckPanelEmpty.tsx
import styled from 'styled-components';

const DeckPanelEmpty = () => (
  <Wrapper>
    <Icon>🃏</Icon>
    <Heading>Your deck will appear here</Heading>
    <Hint>Try: "Build me a Selesnya tokens Commander deck with Rhys the Redeemed"</Hint>
  </Wrapper>
);

export default DeckPanelEmpty;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem 1.5rem;
  background: white;
`;

const Icon = styled.div`font-size: 2.5rem;`;

const Heading = styled.p`
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
  margin: 0;
`;

const Hint = styled.p`
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0;
`;
