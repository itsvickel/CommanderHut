import React, { useState } from 'react';
import styled from 'styled-components';
import CardModal from './CardModal';
import type { Card } from "../../Interface/index";

interface CardProps {
  key?: number;
  obj: Card;
}

const CardItem: React.FC<CardProps> = ({ obj, key }) => {
  const [isModal, setIsModal] = useState<boolean>(false);

  return (
    <CardWrapper key={key} $modalOpen={isModal}>
      {obj ? (
        <>
          <CardBox onClick={() => !isModal && setIsModal(true)} $modalOpen={isModal}>
            <CardImage
              src={obj?.image_uris?.large || obj?.image_uris?.normal}
              alt={obj.name}
            />
          </CardBox>
        </>
      ) : (
        <p>No card data available</p>
      )}

      {isModal && (
        <CardModal isOpen={isModal} onClose={() => setIsModal(false)}>
          <ModalContent>
            <ModalImage
              src={obj?.image_uris?.png || obj?.image_uris?.normal}
              alt={obj.name}
            />
            <CardDetails>
              <h3>{obj.name}</h3>
              <Detail><strong>Mana Cost:</strong> {obj.mana_cost}</Detail>
              <Detail><strong>Type:</strong> {obj.type_line}</Detail>
              <Detail><strong>Text:</strong> {obj.oracle_text}</Detail>
              <Detail><strong>Set:</strong> {obj.set_name}</Detail>
              <Detail><strong>Artist:</strong> {obj.artist}</Detail>
              <Detail><strong>Released:</strong> {obj.released_at}</Detail>
              <Detail><strong>Layout:</strong> {obj.layout}</Detail>
              <LegalitiesTable>
                  {Object.entries(obj.legalities).map(([format, status]) => (
                    <LegalItem>
                      <td>{format.toUpperCase()}</td>
                      <td>{status === 'legal' ? '✅' : '❌'}</td>
                    </LegalItem>
                  ))}
              </LegalitiesTable>
            </CardDetails>
          </ModalContent>
        </CardModal>
      )}
    </CardWrapper>
  );
};

export default CardItem;

// Styled Components

const CardWrapper = styled.div`
  padding: 1rem;
  background-color: #faf7f2;
  border: 2px solid #e0dacf;
  border-radius: 12px;
  max-width: 340px;
  margin: 0 auto;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
`;

const CardBox = styled.div<{ $modalOpen: boolean }>`
  cursor: ${({ $modalOpen }) => ($modalOpen ? 'default' : 'pointer')};
  transition: transform 0.2s ease;

  ${({ $modalOpen }) =>
    !$modalOpen &&
    `
    &:hover {
      transform: scale(1.05);
    }
  `}
`;
const CardImage = styled.img`
  width: 70%;
  height: auto;
  border-radius: 10px;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  width: 60vw;
  height: 80vh;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 2rem;
  }
`;

const ModalImage = styled.img`
  width: 25vw;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
`;

const CardDetails = styled.div`
  max-width: 500px;
  text-align: left;
  font-size: 1rem;
  background: #fff;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e6e6e6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
`;

const Detail = styled.div`
  margin-bottom: 0.5rem;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const LegalitiesTable = styled.table`
  display: flex;
  flex-wrap: wrap;
 
`;

const LegalItem = styled.div`
  width: 50%;
`;