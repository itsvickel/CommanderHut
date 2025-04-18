import React from 'react';

import styled from 'styled-components';

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
const Deck: React.FC<DeckProps> = ({ obj, key }) => {
  return (
    <div key={key}>
      
    </div>
  );
};

export default Deck;

 