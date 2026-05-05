import React from 'react';

// Define the Props interface outside the component for better readability
interface DeckProps {
  key?: number,
  obj: {
    name?: string;
    image_uris?: {
      normal: string;
    };
    oracle_text?: string;
  };
}

// Update the component to accept props of type CardProps
const Deck: React.FC<DeckProps> = ({ key }) => {
  return (
    <div key={key}>

    </div>
  );
};

export default Deck;
