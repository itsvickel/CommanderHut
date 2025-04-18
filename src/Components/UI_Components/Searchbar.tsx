import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

type SearchBarProps = {
  fetchOptions: (query: string) => Promise<any[]>;
  onSelect: (item: any) => void;
};

const SearchBar = ({ fetchOptions, onSelect }: SearchBarProps) => {

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced query fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim() === '') {
      setOptions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await fetchOptions(query);
      setOptions(results);
      setShowDropdown(true);
    }, 300);
  }, [query, fetchOptions]);

  return (
    <Wrapper ref={wrapperRef}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        onFocus={() => {
          if (options?.length > 0) setShowDropdown(true);
        }}
      />
      {showDropdown && options?.length > 0 && (
        <Dropdown>
          {options.map((item, index) => (
            <Option
              key={index}
              onClick={() => {
                onSelect(item);
                setQuery('');
                setOptions([]);
                setShowDropdown(false);
              }}
            >
              {item.name ?? JSON.stringify(item)}
            </Option>
          ))}
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default SearchBar;

const Wrapper = styled.div`
  position: relative;
  width: 300px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
`;

const Dropdown = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Option = styled.li`
  padding: 0.75rem 1rem;
  cursor: pointer;

  &:hover {
    background-color: #f2f2f2;
  }
`;