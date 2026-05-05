import React, { useState, useEffect, useRef } from 'react';

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
    <div ref={wrapperRef} className="relative w-[300px]">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        onFocus={() => {
          if (options?.length > 0) setShowDropdown(true);
        }}
        className="w-full px-4 py-[0.6rem] border border-[#ccc] rounded-md text-base"
      />
      {showDropdown && options?.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-white border border-[#ccc] border-t-0 max-h-[200px] overflow-y-auto z-[1000] rounded-b-md shadow-[0_2px_6px_rgba(0,0,0,0.1)] list-none m-0 p-0">
          {options.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                onSelect(item);
                setQuery('');
                setOptions([]);
                setShowDropdown(false);
              }}
              className="px-4 py-3 cursor-pointer hover:bg-[#f2f2f2]"
            >
              <div className="flex flex-row">
                {item.image_uris?.normal && (
                  <img src={item.image_uris.normal} alt={item.name} className="w-10 h-auto rounded mr-2.5" />
                )}
                <span className="text-base whitespace-nowrap overflow-hidden text-ellipsis">{item.name ?? JSON.stringify(item)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
