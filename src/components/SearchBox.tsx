import { forwardRef } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  function SearchBox({ value, onChange }, ref) {
    return (
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search parks... (press /)"
          className="w-full font-mono text-[13px] text-text-primary bg-bg-secondary border border-bg-elevated rounded-lg pl-9 pr-10 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary/30"
          aria-label="Search parks by name"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated/50 transition-colors"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
