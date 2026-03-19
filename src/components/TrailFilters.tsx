import type { DifficultyFilter, TrailLengthFilter } from '../lib/parks-utils';
import { DIFFICULTY_OPTIONS, TRAIL_LENGTH_OPTIONS, TRAIL_LENGTH_LABELS } from '../lib/parks-utils';

interface FilterRowProps<T extends string> {
  label: string;
  active: T;
  options: readonly T[];
  getLabel?: (opt: T) => string;
  onChange: (val: T) => void;
}

function FilterRow<T extends string>({ label, active, options, getLabel, onChange }: FilterRowProps<T>) {
  return (
    <section aria-label={label} className="overflow-x-auto scrollbar-hide">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5">
        {label}
      </div>
      <div className="flex gap-1.5">
        {options.map((opt) => {
          const isActive = active === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`
                font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                py-1.5 px-3 rounded-full whitespace-nowrap
                transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/50
                ${isActive ? 'bg-bg-elevated text-text-primary' : 'bg-transparent text-text-secondary hover:text-text-primary/70'}
              `}
              aria-pressed={isActive}
            >
              {getLabel ? getLabel(opt) : opt}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface DifficultyFiltersProps {
  active: DifficultyFilter;
  onChange: (d: DifficultyFilter) => void;
}

export function DifficultyFilters({ active, onChange }: DifficultyFiltersProps) {
  return (
    <FilterRow
      label="Difficulty"
      active={active}
      options={DIFFICULTY_OPTIONS}
      onChange={onChange}
    />
  );
}

interface TrailLengthFiltersProps {
  active: TrailLengthFilter;
  onChange: (t: TrailLengthFilter) => void;
}

export function TrailLengthFilters({ active, onChange }: TrailLengthFiltersProps) {
  return (
    <FilterRow
      label="Trail Length"
      active={active}
      options={TRAIL_LENGTH_OPTIONS}
      getLabel={(opt) => TRAIL_LENGTH_LABELS[opt]}
      onChange={onChange}
    />
  );
}

interface RideableToggleProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

export function RideableToggle({ enabled, onToggle }: RideableToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`
        font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
        py-1.5 px-3 rounded-full whitespace-nowrap
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/50
        ${enabled ? 'bg-status-open-bg text-status-open' : 'bg-transparent text-text-secondary hover:text-text-primary/70'}
      `}
      aria-pressed={enabled}
    >
      {enabled ? 'Showing rideable only' : 'Show rideable only'}
    </button>
  );
}
