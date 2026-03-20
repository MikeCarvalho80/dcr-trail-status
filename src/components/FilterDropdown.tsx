import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XIcon } from 'lucide-react';

interface FilterDropdownProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  getLabel?: (opt: T) => string;
  getCount?: (opt: T) => number;
  allLabel?: string;
  allValue: T;
  onChange: (val: T) => void;
}

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  getLabel,
  getCount,
  allLabel = 'All',
  allValue,
  onChange,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayValue = value === allValue
    ? allLabel
    : (getLabel ? getLabel(value) : value);
  const isFiltered = value !== allValue;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2
          font-mono text-[12px] font-semibold
          px-3 py-2.5 rounded-lg border
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/50
          ${isFiltered
            ? 'bg-bg-elevated text-text-primary border-text-muted/50'
            : 'bg-bg-primary/50 text-text-secondary border-bg-elevated hover:border-text-muted/30'}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-text-muted uppercase tracking-[0.05em] text-[10px] flex-shrink-0">
            {label}
          </span>
          <span className="truncate">
            {displayValue}
          </span>
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {isFiltered && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(allValue); }}
              className="p-0.5 rounded hover:bg-bg-elevated/80"
              aria-label={`Clear ${label} filter`}
            >
              <XIcon className="w-3 h-3 text-text-muted" />
            </span>
          )}
          <ChevronDownIcon className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-secondary border border-bg-elevated rounded-lg shadow-lg max-h-[240px] overflow-y-auto scrollbar-hide"
          role="listbox"
          aria-label={label}
        >
          {options.map((opt) => {
            const isSelected = value === opt;
            const optLabel = opt === allValue ? allLabel : (getLabel ? getLabel(opt) : opt);
            const count = getCount ? getCount(opt) : undefined;
            return (
              <button
                key={opt}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`
                  w-full text-left px-3 py-2.5 font-mono text-[12px] flex items-center justify-between
                  transition-colors duration-100
                  ${isSelected
                    ? 'bg-bg-elevated text-text-primary font-semibold'
                    : 'text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary'}
                `}
              >
                <span>{optLabel}</span>
                {count !== undefined && (
                  <span className="text-text-muted text-[11px] ml-2">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
