import React from 'react';

import styled from 'styled-components'; 

// Define the Props interface outside the component for better readability
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

// Update the component to accept props of type CardProps
const CardModal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <Backdrop onClick={onClose} />
      <ModalWindow>
      {children}
        <CloseButton onClick={onClose}>Close</CloseButton>
      </ModalWindow>
    </Overlay> 
  );
};

export default CardModal;

const Container = styled.div`
  

`;


const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
`;

const ModalWindow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;
  border-radius: 12px;
  z-index: 1000;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #555;
  }
`;