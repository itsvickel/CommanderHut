import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

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
    <Wrapper ref={ref}>
      <TriggerButton
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label="Deck options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        •••
      </TriggerButton>
      {open && (
        <Dropdown role="menu">
          <DropdownItem role="menuitem" onClick={handleEdit}><span aria-hidden="true">✏</span> Edit deck</DropdownItem>
          <DropdownItem role="menuitem" $danger onClick={handleDelete}><span aria-hidden="true">🗑</span> Delete</DropdownItem>
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default DeckOverflowMenu;

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const TriggerButton = styled.button`
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  color: #444;
  letter-spacing: 2px;
  line-height: 1;
  &:hover { background: rgba(0, 0, 0, 0.15); }
  &:focus-visible { outline: 2px solid #555; outline-offset: 2px; }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 140px;
  z-index: 100;
  overflow: hidden;
`;

const DropdownItem = styled.button<{ $danger?: boolean }>`
  display: block;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: ${({ $danger }) => ($danger ? '#c0392b' : '#333')};
  &:hover {
    background: ${({ $danger }) => ($danger ? '#fdf0ef' : '#f5f5f5')};
  }
`;
