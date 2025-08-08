import React from 'react';

interface DeckProps {
  key?: number;
}

const Deck: React.FC<DeckProps> = ({ key }) => {
  return <div key={key} />;
};

export default Deck;

 