import { useMemo, useState } from 'react';
import { SummaryStats } from './components/SummaryStats';
import { SeasonTimeline } from './components/SeasonTimeline';
import { RegionFilters } from './components/RegionFilters';
import type { FilterOption } from './components/RegionFilters';
import { ParkCard } from './components/ParkCard';
import { PARKS } from './data/parks';
import { getTrailStatus, sortByStatus } from './lib/status';

export function App() {
  const [activeRegion, setActiveRegion] = useState<FilterOption>('All');

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const filteredParks = useMemo(() => {
    const filtered =
      activeRegion === 'All'
        ? [...PARKS]
        : PARKS.filter((p) => p.region === activeRegion);
    return sortByStatus(filtered);
  }, [activeRegion]);

  const counts = useMemo(() => {
    const c = { open: 0, caution: 0, closed: 0 };
    filteredParks.forEach((p) => {
      const s = getTrailStatus(p).status;
      c[s]++;
    });
    return c;
  }, [filteredParks]);

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-[640px] mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="font-mono text-[9px] text-text-muted uppercase tracking-[0.15em] mb-1">
            MTB Trail Status
          </div>
          <h1 className="font-mono text-[22px] font-bold text-text-primary leading-tight">
            Spring Restriction Monitor
          </h1>
          <p className="font-mono text-[10px] text-text-secondary mt-1 uppercase tracking-[0.05em]">
            {dateStr} · {PARKS.length} parks within 1hr of Hyde Park
          </p>
        </header>

        {/* Summary Stats */}
        <div className="mb-5">
          <SummaryStats counts={counts} />
        </div>

        {/* Season Timeline */}
        <div className="mb-5">
          <SeasonTimeline />
        </div>

        {/* Region Filters */}
        <div className="mb-4">
          <RegionFilters
            activeRegion={activeRegion}
            onRegionChange={setActiveRegion}
          />
        </div>

        {/* Park Cards */}
        <section aria-label="Trail list" className="space-y-2.5">
          {filteredParks.map((park) => (
            <ParkCard key={park.id} park={park} />
          ))}

          {filteredParks.length === 0 && (
            <div className="text-center py-8">
              <p className="font-mono text-[11px] text-text-muted">
                No parks in this region.
              </p>
            </div>
          )}
        </section>

        {/* Status Logic */}
        <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mt-5">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
            Status Logic
          </div>
          <p className="font-mono text-[10px] text-text-secondary leading-relaxed">
            DCR parks with formal March closures (Blue Hills, Fells): calendar-based, mandatory. "Or as posted" at the Fells means staff can extend past 3/31. Lynn Woods: City of Lynn bans winter biking, reopens in spring. Great Brook: winter XC ski operations close trails to bikes. All others: mud season advisory March through early April.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-bg-elevated">
          <p className="font-mono text-[9px] text-text-muted text-center">
            Ride responsibly · Respect mud season · Stay off wet trails · Support NEMBA
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;
