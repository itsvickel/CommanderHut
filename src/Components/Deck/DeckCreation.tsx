import React from 'react';

import styled from 'styled-components';

import { Modal } from '../UI_Components';

// Define the Props interface outside the component for better readability
interface DeckProps {
 
}

// Update the component to accept props of type CardProps
const DeckCreation: React.FC<DeckProps> = ({ obj, key }) => {
  return (
    <div key={key}>
        <Modal
        isOpen={true}
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

 