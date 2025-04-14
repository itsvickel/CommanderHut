import React from 'react';

import styled from 'styled-components';

// Define the Props interface outside the component for better readability
interface CardProps {
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
const CardItem: React.FC<CardProps> = ({ obj, key }) => {
  return (
    <div key={key}>
      {/* Render the card data */}
      {obj ? (
        <>
          <Image src={obj?.image_uris?.normal} alt={obj.name} />
        </>
      ) : (
        <p>No card data available</p>
      )}
    </div>
  );
};

export default CardItem;

const Image = styled.img`
    width: 223px; /* MTG card size approximation */
    height: auto; /* auto height keeps aspect ratio */
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;

    &:hover {
    transform: scale(1.05);
    }
`;