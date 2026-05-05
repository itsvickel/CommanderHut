import { useEffect, useRef, useState } from 'react';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

const DeckOverflowMenu = ({ onEdit, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
    onDelete();
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label="Deck options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="bg-black/8 border-none rounded-md px-2.5 py-1 cursor-pointer text-base font-bold text-[#444] tracking-widest leading-none hover:bg-black/15 focus-visible:outline-2 focus-visible:outline-[#555] focus-visible:outline-offset-2"
      >
        •••
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+4px)] right-0 bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] min-w-[140px] z-[100] overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={handleEdit}
            className="block w-full px-3.5 py-2.5 text-left bg-none border-none cursor-pointer text-[0.9rem] text-[#333] hover:bg-[#f5f5f5]"
          >
            <span aria-hidden="true">✏</span> Edit deck
          </button>
          <button
            role="menuitem"
            onClick={handleDelete}
            className="block w-full px-3.5 py-2.5 text-left bg-none border-none cursor-pointer text-[0.9rem] text-[#c0392b] hover:bg-[#fdf0ef]"
          >
            <span aria-hidden="true">🗑</span> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DeckOverflowMenu;
