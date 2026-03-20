import type { FilterOption } from './RegionFilters';
import type { StatusFilter } from './SummaryStats';
import type { DifficultyFilter, TrailLengthFilter } from '../lib/parks-utils';
import { TRAIL_LENGTH_LABELS } from '../lib/parks-utils';

interface ActiveFilterSummaryProps {
  count: number;
  statusFilter: StatusFilter;
  region: FilterOption;
  difficulty: DifficultyFilter;
  trailLength: TrailLengthFilter;
  rideableOnly: boolean;
  searchQuery: string;
  onClearAll: () => void;
}

export function ActiveFilterSummary({
  count, statusFilter, region, difficulty, trailLength, rideableOnly, searchQuery, onClearAll,
}: ActiveFilterSummaryProps) {
  const hasFilters = statusFilter || region !== 'All' || difficulty !== 'All' || trailLength !== 'All' || rideableOnly || searchQuery;
  if (!hasFilters) return null;

  const parts: string[] = [];
  if (statusFilter) parts.push(statusFilter);
  if (region !== 'All') parts.push(region);
  if (difficulty !== 'All') parts.push(difficulty);
  if (trailLength !== 'All') parts.push(TRAIL_LENGTH_LABELS[trailLength]);
  if (rideableOnly) parts.push('rideable only');
  if (searchQuery) parts.push(`"${searchQuery}"`);

  return (
    <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-text-muted mb-3 px-1">
      <span>
        <span className="text-text-primary font-semibold">{count}</span> park{count !== 1 ? 's' : ''} · {parts.join(' · ')}
      </span>
      <button
        onClick={onClearAll}
        className="text-status-open font-semibold hover:underline flex-shrink-0"
      >
        Clear all
      </button>
    </div>
  );
}
