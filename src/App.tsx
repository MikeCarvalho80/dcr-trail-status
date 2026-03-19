import { useMemo, useState } from 'react';
import { SummaryStats } from './components/SummaryStats';
import { SeasonTimeline } from './components/SeasonTimeline';
import { RegionFilters } from './components/RegionFilters';
import type { FilterOption } from './components/RegionFilters';
import { DistanceControls } from './components/DistanceControls';
import { ParkCard } from './components/ParkCard';
import { PARKS } from './data/parks';
import type { Region } from './data/parks';
import { getZipCoords } from './data/zipcodes';
import { getTrailStatus, sortByStatusAndDistance } from './lib/status';
import { haversineDistance, estimateDriveMinutes } from './lib/geo';
import { useUserPrefs } from './lib/useUserPrefs';
import { useDailyRefresh } from './lib/useDailyRefresh';

// Stable region display order
const REGION_ORDER: Region[] = [
  'Greater Boston',
  'South Shore',
  'North Shore',
  'MetroWest',
  'Central MA',
  'Pioneer Valley',
  'Berkshires',
  'Cape & Islands',
  'Southern NH',
  'Rhode Island',
  'Connecticut',
  'Southern VT',
];

export function App() {
  const { prefs, setZipCode, setRadius } = useUserPrefs();
  const [activeRegion, setActiveRegion] = useState<FilterOption>('All');

  const now = useDailyRefresh(6, 'America/New_York');
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const origin = getZipCoords(prefs.zipCode);
  const isValidZip = origin !== null;

  // Compute distances for all parks from origin
  const distances = useMemo(() => {
    const map = new Map<string, number>();
    if (!origin) return map;
    for (const park of PARKS) {
      map.set(park.id, haversineDistance(origin.lat, origin.lng, park.lat, park.lng));
    }
    return map;
  }, [origin]);

  // Filter by distance radius
  const parksInRange = useMemo(() => {
    if (!origin) return PARKS; // show all if ZIP invalid
    return PARKS.filter((p) => (distances.get(p.id) ?? Infinity) <= prefs.radiusMiles);
  }, [origin, distances, prefs.radiusMiles]);

  // Derive available regions from distance-filtered parks
  const availableRegions = useMemo(() => {
    const regionSet = new Set(parksInRange.map((p) => p.region));
    return REGION_ORDER.filter((r) => regionSet.has(r));
  }, [parksInRange]);

  // Reset region filter if current selection is no longer available
  const effectiveRegion: FilterOption =
    activeRegion !== 'All' && !availableRegions.includes(activeRegion as Region)
      ? 'All'
      : activeRegion;

  // Filter by region, then sort by status + distance
  const filteredParks = useMemo(() => {
    const filtered =
      effectiveRegion === 'All'
        ? [...parksInRange]
        : parksInRange.filter((p) => p.region === effectiveRegion);
    return sortByStatusAndDistance(filtered, distances);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRegion, parksInRange, distances, now]);

  // Status counts
  const counts = useMemo(() => {
    const c = { open: 0, caution: 0, closed: 0 };
    filteredParks.forEach((p) => {
      c[getTrailStatus(p).status]++;
    });
    return c;
  }, [filteredParks, now]);

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-[640px] mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="font-mono text-[12px] text-text-muted uppercase tracking-[0.15em] mb-1">
            MTB Trail Status
          </div>
          <h1 className="font-mono text-[26px] font-bold text-text-primary leading-tight">
            Spring Restriction Monitor
          </h1>
          <p className="font-mono text-[13px] text-text-secondary mt-1 uppercase tracking-[0.05em]">
            {dateStr} · {PARKS.length} trails across New England
          </p>
        </header>

        {/* Disclaimer */}
        <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mb-5">
          <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
            Trail status information is derived from publicly available sources and may not reflect real-time conditions. Always verify closures with local land managers before riding. Use at your own risk.
          </p>
        </div>

        {/* Distance Controls */}
        <div className="mb-5">
          <DistanceControls
            zipCode={prefs.zipCode}
            radiusMiles={prefs.radiusMiles}
            onZipChange={setZipCode}
            onRadiusChange={setRadius}
            parkCount={filteredParks.length}
            isValidZip={isValidZip}
          />
        </div>

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
            activeRegion={effectiveRegion}
            onRegionChange={setActiveRegion}
            availableRegions={availableRegions}
          />
        </div>

        {/* Park Cards */}
        <section aria-label="Trail list" className="space-y-2.5">
          {filteredParks.map((park) => {
            const d = distances.get(park.id);
            return (
              <ParkCard
                key={park.id}
                park={park}
                distanceMiles={d != null ? Math.round(d) : undefined}
                driveMinutes={d != null ? estimateDriveMinutes(d) : undefined}
              />
            );
          })}

          {filteredParks.length === 0 && (
            <div className="text-center py-8">
              <p className="font-mono text-[13px] text-text-muted">
                No parks within {prefs.radiusMiles} miles. Try increasing the range.
              </p>
            </div>
          )}
        </section>

        {/* Status Logic */}
        <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mt-5">
          <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
            Status Logic
          </div>
          <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
            Parks with formal closures follow calendar-based mandatory rules. "Or as posted" means staff can extend beyond posted dates. Advisory parks have no formal closure but riders should avoid wet trails during mud season (March–early April). Drive times are estimates based on straight-line distance.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-bg-elevated">
          <p className="font-mono text-[11px] text-text-muted text-center">
            Ride responsibly · Respect mud season · Stay off wet trails · Support NEMBA
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;
