import { FC } from 'react';
import { Modal } from '../UI_Components';

interface DeckProps {}

const DeckCreation: FC<DeckProps> = () => {
  return (
    <div>
      <Modal
        isOpen={false}
        onClose={() => {}}
        onSubmit={() => {}}
        submitLabel="Create"
        title="Create Deck"
      >
        <div>Coming soon</div>
      </Modal>
    </div>
  );
};

export default DeckCreation;

 