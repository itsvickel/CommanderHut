import React, { useState } from 'react';

import { Modal } from '../UI_Components';

// Define the Props interface outside the component for better readability
interface DeckProps {

}

// Update the component to accept props of type CardProps
const DeckCreation: React.FC<DeckProps> = () => {
  const [open, setOpen] = useState(false);
  const [text] = useState('');

  return (
    <div>
        <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={() => {
          console.log("Submitted:", text);
          setOpen(false);
        }}
        submitLabel="Create"
        title="Edit Info"
      >
        <div>
            hi
        </div>
      </Modal>
    </div>
  );
};

export default DeckCreation;
