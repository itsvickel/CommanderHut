import React from 'react';

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
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-xl z-[1000] min-w-[300px] max-w-[90%] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        {children}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-[#333] text-white border-none rounded-md cursor-pointer hover:bg-[#555]"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CardModal;
