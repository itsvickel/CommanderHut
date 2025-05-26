import React from 'react';
import styled from 'styled-components';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  submitLabel?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Modal Title",
  submitLabel = "Submit",
  children,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalBox>
        <Header>
          <Title>{title}</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>
        <Content>{children}</Content>
        <Footer>
          <ButtonCancel onClick={onClose}>Cancel</ButtonCancel>
          <ButtonSubmit onClick={onSubmit}>{submitLabel}</ButtonSubmit>
        </Footer>
      </ModalBox>
    </Overlay>
  );
};

export default Modal;

// Styles

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Content = styled.div`
  margin-bottom: 1.5rem;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const ButtonCancel = styled.button`
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`;

const ButtonSubmit = styled.button`
  padding: 0.5rem 1rem;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
`;
