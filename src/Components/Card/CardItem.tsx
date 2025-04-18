import React, {useState} from 'react';

import styled from 'styled-components';
import CardModal from './CardModal';
import type { Card } from "../../Interface/index";

// Define the Props interface outside the component for better readability
// Define the Props interface
interface CardProps {
  key?: number;
  obj: Card;
}
// Update the component to accept props of type CardProps
const CardItem: React.FC<CardProps> = ({ obj, key }) => {

  const [isModal, setIsModal] = useState<boolean>(false);

  return (
    <div key={key}>
      {/* Render the card data */}
      {obj ? (
        <>
          <Image onClick={()=>setIsModal(!isModal)} src={obj?.image_uris?.normal} alt={obj.name} />
        </>
      ) : (
        <p>No card data available</p>
      )}

        {
          isModal ? <CardModal   
                      isOpen={isModal}
                      onClose={()=>setIsModal(false)}
                      >
                    <Image onClick={()=>setIsModal(!isModal)} src={obj?.image_uris?.normal} alt={obj.name} />
                    <div>Name: {obj.name}</div>
                    <div>mana_cost: {obj.mana_cost}</div>
                    <div>type_line: {obj.type_line}</div>
                    <div>oracle_text: {obj.oracle_text}</div>
                    <div>colors: {obj.colors}</div>
                    <div>set_name: {obj.set_name}</div>
                    <div>artist: {obj.artist}</div>
                    <div>released_at: {obj.released_at}</div>
                    <div>layout: {obj.layout}</div>
          </CardModal> : null
        }

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
    transform: scale(1.2);
    cursor: pointer;
    }
`;