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
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-deck-modal-title"
        className="bg-white rounded-xl px-8 py-7 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="delete-deck-modal-title" className="mt-0 mb-2.5 text-[1.2rem] text-[#c0392b]">Delete "{deckName}"?</h3>
        <p className="mt-0 mb-5 text-[#555] text-[0.95rem]">This action cannot be undone.</p>
        {isDeleting && <p className="text-[#888] text-[0.85rem] mt-0 mb-3">Deleting...</p>}
        {deleteError && <p className="text-[#c0392b] text-[0.85rem] mt-0 mb-3">{deleteError}</p>}
        <div className="flex gap-2.5 justify-end">
          <button
            type="button"
            autoFocus
            className="px-[18px] py-2 border border-[#ccc] rounded-md bg-white cursor-pointer text-[0.9rem] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-[18px] py-2 border-none rounded-md bg-[#c0392b] text-white cursor-pointer text-[0.9rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a93226]"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDeckModal;
