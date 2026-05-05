import styled from 'styled-components';

interface Props {
  isOpen: boolean;
  deckName: string;
  isDeleting: boolean;
  deleteError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteDeckModal = ({ isOpen, deckName, isDeleting, deleteError, onConfirm, onCancel }: Props) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onCancel}>
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-deck-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <Title id="delete-deck-modal-title">Delete "{deckName}"?</Title>
        <Body>This action cannot be undone.</Body>
        {isDeleting && <StatusText>Deleting...</StatusText>}
        {deleteError && <ErrorText>{deleteError}</ErrorText>}
        <Actions>
          <CancelBtn type="button" autoFocus onClick={onCancel} disabled={isDeleting}>Cancel</CancelBtn>
          <DeleteBtn type="button" onClick={onConfirm} disabled={isDeleting}>Delete</DeleteBtn>
        </Actions>
      </Modal>
    </Overlay>
  );
};

export default DeleteDeckModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h3`
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #c0392b;
`;

const Body = styled.p`
  margin: 0 0 20px;
  color: #555;
  font-size: 0.95rem;
`;

const StatusText = styled.p`
  color: #888;
  font-size: 0.85rem;
  margin: 0 0 12px;
`;

const ErrorText = styled.p`
  color: #c0392b;
  font-size: 0.85rem;
  margin: 0 0 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const CancelBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #f5f5f5; }
`;

const DeleteBtn = styled.button`
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: #c0392b;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #a93226; }
`;
