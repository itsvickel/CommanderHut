import React from 'react';

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
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-[999]">
      <div className="bg-white rounded-xl max-w-[600px] w-[90%] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[1.25rem] m-0">{title}</h2>
          <button
            onClick={onClose}
            className="bg-none border-none text-[1.5rem] cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#e0e0e0] border-none rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-[#0070f3] text-white border-none rounded-lg cursor-pointer"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
