import type { Region } from '../data/parks';

export type FilterOption = 'All' | Region;

interface RegionFiltersProps {
  activeRegion: FilterOption;
  onRegionChange: (region: FilterOption) => void;
  availableRegions: Region[];
}

export function RegionFilters({ activeRegion, onRegionChange, availableRegions }: RegionFiltersProps) {
  const options: FilterOption[] = ['All', ...availableRegions];

  return (
    <section aria-label="Filter by region" className="overflow-x-auto scrollbar-hide">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5">
        Region
      </div>
      <div className="flex gap-1.5">
        {options.map((region) => {
          const isActive = activeRegion === region;
          return (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={`
                font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                py-1.5 px-3 rounded-full whitespace-nowrap
                transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/50
                ${isActive ? 'bg-bg-elevated text-text-primary' : 'bg-transparent text-text-secondary hover:text-text-primary/70'}
              `}
              aria-pressed={isActive}
            >
              {region}
            </button>
          );
        })}
      </div>
    </section>
  );
}
