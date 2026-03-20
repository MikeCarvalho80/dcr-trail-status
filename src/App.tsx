import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { SummaryStats } from './components/SummaryStats';
import type { StatusFilter } from './components/SummaryStats';
import { SeasonTimeline } from './components/SeasonTimeline';
import { RegionFilters } from './components/RegionFilters';
import type { FilterOption } from './components/RegionFilters';
import { DistanceControls } from './components/DistanceControls';
import { DifficultyFilters, TrailLengthFilters, RideableToggle } from './components/TrailFilters';
import { SearchBox } from './components/SearchBox';
import { ParkCard } from './components/ParkCard';
import { SuggestedRides } from './components/SuggestedRides';
import { StatusChangeBanner } from './components/StatusChangeBanner';
import { ClosureCalendar } from './components/ClosureCalendar';
import { PARKS } from './data/parks';
import type { Region, TrailStatus } from './data/parks';
import { getZipCoords } from './data/zipcodes';
import { getTrailStatus, sortByStatusAndDistance } from './lib/status';
import { haversineDistance, estimateDriveMinutes } from './lib/geo';
import { useUserPrefs } from './lib/useUserPrefs';
import { useGeolocation } from './lib/useGeolocation';
import { useDailyRefresh } from './lib/useDailyRefresh';
import type { DifficultyFilter, TrailLengthFilter } from './lib/parks-utils';
import { parseMiles, matchesLengthRange } from './lib/parks-utils';
import { readUrlState, useUrlSync } from './lib/useUrlState';
import { loadSnapshot, saveSnapshot, getChangedParks } from './lib/statusChanges';
import { getSuggestedRides } from './lib/recommendations';
import { ShareQR } from './components/ShareQR';
import { getLastScrapedAt, hasAnyConditions } from './lib/conditions';
import { getNewParkCount } from './lib/whatsNew';
import { MapIcon, ListIcon, CalendarIcon } from 'lucide-react';

import { EmbedCard } from './components/EmbedCard';
import { ErrorBoundary } from './components/ErrorBoundary';

const TrailMap = lazy(() => import('./components/TrailMap').then((m) => ({ default: m.TrailMap })));

// Stable region display order
const REGION_ORDER: Region[] = [
  'Greater Boston', 'South Shore', 'North Shore', 'MetroWest',
  'Central MA', 'Pioneer Valley', 'Berkshires', 'Cape & Islands',
  'Southern NH', 'Rhode Island', 'Connecticut', 'Southern VT',
  'Southern Maine', 'Midcoast Maine', 'Western Maine',
  'Central VT', 'Central NH', 'Western NH',
  'Hudson Valley', 'Upstate NY', 'NYC & Long Island',
  'Northern NJ', 'Central NJ',
  'Eastern PA', 'Central PA', 'Poconos',
  'Maryland', 'Delaware',
];

// Read URL params once on load
const initialUrl = readUrlState();

export function App() {
  // Embed mode: ?embed=parkId renders a standalone card
  const embedId = new URLSearchParams(window.location.search).get('embed');
  if (embedId) return <EmbedCard parkId={embedId} />;

  const { prefs, setZipCode, setRadius, toggleFavorite, setShowRideableOnly, toggleVisited } = useUserPrefs();
  const [activeRegion, setActiveRegion] = useState<FilterOption>(initialUrl.region ?? 'All');
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>(initialUrl.difficulty ?? 'All');
  const [activeTrailLength, setActiveTrailLength] = useState<TrailLengthFilter>(initialUrl.length ?? 'All');
  const [searchQuery, setSearchQuery] = useState(initialUrl.search ?? '');
  const [showMap, setShowMap] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialUrl.status ?? null);
  const [geoDetecting, setGeoDetecting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLElement>(null);

  // Auto-detect device location on first load
  useGeolocation(prefs.zipCode, '02136', setZipCode, setGeoDetecting);

  // Apply URL overrides on first load
  useState(() => {
    if (initialUrl.zip) setZipCode(initialUrl.zip);
    if (initialUrl.radius) setRadius(initialUrl.radius);
    if (initialUrl.rideable) setShowRideableOnly(true);
  });

  // Status change detection
  const [statusChanges, setStatusChanges] = useState<Map<string, { from: TrailStatus; to: TrailStatus }>>(new Map());
  useEffect(() => {
    const previous = loadSnapshot();
    const current: Record<string, TrailStatus> = {};
    for (const park of PARKS) {
      current[park.id] = getTrailStatus(park).status;
    }
    const changes = getChangedParks(previous, current);
    if (changes.size > 0) setStatusChanges(changes);
    saveSnapshot(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
        setShowMap((v) => !v);
      }
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        setShowRideableOnly(!prefs.showRideableOnly);
      }
      if (e.key === 'Escape') {
        if (searchQuery) { setSearchQuery(''); }
        else { (document.activeElement as HTMLElement)?.blur(); }
      }
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        setShowCalendar((v) => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, prefs.showRideableOnly, setShowRideableOnly]);

  const now = useDailyRefresh(6, 'America/New_York');
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const origin = getZipCoords(prefs.zipCode);
  const isValidZip = origin !== null;

  // Sync state to URL
  useUrlSync({
    zipCode: prefs.zipCode,
    radiusMiles: prefs.radiusMiles,
    activeRegion,
    activeDifficulty,
    activeTrailLength,
    searchQuery,
    showRideableOnly: prefs.showRideableOnly,
    statusFilter,
  });

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
    if (!origin) return PARKS;
    return PARKS.filter((p) => (distances.get(p.id) ?? Infinity) <= prefs.radiusMiles);
  }, [origin, distances, prefs.radiusMiles]);

  // Derive available regions from distance-filtered parks
  const availableRegions = useMemo(() => {
    const regionSet = new Set(parksInRange.map((p) => p.region));
    return REGION_ORDER.filter((r) => regionSet.has(r));
  }, [parksInRange]);

  const effectiveRegion: FilterOption =
    activeRegion !== 'All' && !availableRegions.includes(activeRegion as Region)
      ? 'All'
      : activeRegion;

  const favoritesSet = useMemo(() => new Set(prefs.favorites), [prefs.favorites]);
  const visitedSet = useMemo(() => new Set(prefs.visited), [prefs.visited]);

  // Full filter pipeline
  const filteredParks = useMemo(() => {
    let filtered = [...parksInRange];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.manager.toLowerCase().includes(q) ||
        p.parking.toLowerCase().includes(q)
      );
    }

    if (effectiveRegion !== 'All') {
      filtered = filtered.filter((p) => p.region === effectiveRegion);
    }
    if (activeDifficulty !== 'All') {
      filtered = filtered.filter((p) => p.difficulty.includes(activeDifficulty));
    }
    if (activeTrailLength !== 'All') {
      filtered = filtered.filter((p) => matchesLengthRange(parseMiles(p.miles), activeTrailLength));
    }
    if (prefs.showRideableOnly) {
      filtered = filtered.filter((p) => getTrailStatus(p).status !== 'closed');
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => getTrailStatus(p).status === statusFilter);
    }

    return sortByStatusAndDistance(filtered, distances, favoritesSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRegion, parksInRange, distances, now, activeDifficulty, activeTrailLength, prefs.showRideableOnly, favoritesSet, searchQuery, statusFilter]);

  // Status counts
  const counts = useMemo(() => {
    const c = { open: 0, caution: 0, closed: 0 };
    filteredParks.forEach((p) => { c[getTrailStatus(p).status]++; });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredParks, now]);

  // Suggested rides
  const suggestedRides = useMemo(
    () => getSuggestedRides(parksInRange, distances, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parksInRange, distances, now],
  );

  // Scroll to top of park list when filters change
  const prevFilterKey = useRef('');
  useEffect(() => {
    const key = `${effectiveRegion}|${activeDifficulty}|${activeTrailLength}|${prefs.showRideableOnly}|${statusFilter}|${searchQuery}`;
    if (prevFilterKey.current && prevFilterKey.current !== key) {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevFilterKey.current = key;
  }, [effectiveRegion, activeDifficulty, activeTrailLength, prefs.showRideableOnly, statusFilter, searchQuery]);

  const [expandedParkId, setExpandedParkId] = useState<string | null>(null);

  function scrollToPark(parkId: string) {
    setExpandedParkId(parkId);
    // Small delay to let the card render expanded before scrolling
    setTimeout(() => {
      const el = document.getElementById(`park-${parkId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-[640px] mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="font-mono text-[26px] font-bold text-text-primary leading-tight">
            TrailClear
          </h1>
          <p className="font-mono text-[13px] text-text-secondary mt-1 uppercase tracking-[0.05em]">
            {dateStr} · {PARKS.length} trails across the Northeast
            {visitedSet.size > 0 && (
              <span className="text-status-open"> · {visitedSet.size} visited</span>
            )}
            {getNewParkCount() > 0 && (
              <span className="text-status-caution"> · {getNewParkCount()} new</span>
            )}
          </p>
        </header>

        {/* Status change banner */}
        <StatusChangeBanner
          changes={statusChanges}
          onDismiss={() => setStatusChanges(new Map())}
        />

        {/* Disclaimer */}
        <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mb-5">
          <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
            Trail status information is derived from publicly available sources and may not reflect real-time conditions. Always verify closures with local land managers before riding. Use at your own risk.
          </p>
        </div>

        {/* Geolocation detecting */}
        {geoDetecting && (
          <div className="font-mono text-[11px] text-text-muted text-center mb-3 animate-pulse">
            Detecting your location...
          </div>
        )}

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

        {/* Suggested Rides */}
        <SuggestedRides
          parks={suggestedRides}
          distances={distances}
          onParkClick={scrollToPark}
        />

        {/* Summary Stats */}
        <div className="mb-5">
          <SummaryStats counts={counts} activeFilter={statusFilter} onFilterChange={setStatusFilter} />
        </div>

        {/* Season Timeline */}
        <div className="mb-5">
          <SeasonTimeline />
        </div>

        {/* Search + View Toggles */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <SearchBox value={searchQuery} onChange={setSearchQuery} ref={searchRef} />
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2 rounded-lg border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30 ${showMap ? 'bg-bg-elevated text-text-primary border-text-muted' : 'bg-bg-secondary text-text-secondary border-bg-elevated hover:text-text-primary'}`}
            aria-label={showMap ? 'Show list view' : 'Show map view'}
          >
            {showMap ? <ListIcon className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
            {showMap ? 'List' : 'Map'}
          </button>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2 rounded-lg border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30 ${showCalendar ? 'bg-bg-elevated text-text-primary border-text-muted' : 'bg-bg-secondary text-text-secondary border-bg-elevated hover:text-text-primary'}`}
            aria-label={showCalendar ? 'Hide calendar' : 'Show closure calendar'}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <ShareQR />
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-5">
            <ErrorBoundary fallback={
              <div className="rounded-xl border border-bg-elevated bg-bg-secondary h-[300px] flex items-center justify-center">
                <span className="font-mono text-[12px] text-text-muted">Map failed to load. Try refreshing.</span>
              </div>
            }>
              <Suspense fallback={
                <div className="rounded-xl border border-bg-elevated bg-bg-secondary h-[300px] flex items-center justify-center">
                  <span className="font-mono text-[12px] text-text-muted">Loading map...</span>
                </div>
              }>
                <TrailMap parks={filteredParks} distances={distances} onParkClick={scrollToPark} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {/* Closure Calendar */}
        {showCalendar && (
          <div className="mb-5">
            <ClosureCalendar />
          </div>
        )}

        {/* Filters */}
        <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
              Filters
            </div>
            <RideableToggle enabled={prefs.showRideableOnly} onToggle={setShowRideableOnly} />
          </div>

          <RegionFilters
            activeRegion={effectiveRegion}
            onRegionChange={setActiveRegion}
            availableRegions={availableRegions}
          />

          <div className="border-t border-bg-elevated my-3" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DifficultyFilters active={activeDifficulty} onChange={setActiveDifficulty} />
            <TrailLengthFilters active={activeTrailLength} onChange={setActiveTrailLength} />
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="font-mono text-[11px] text-text-muted/50 mb-3 hidden sm:block">
          <kbd className="border border-bg-elevated rounded px-1">/</kbd> search · <kbd className="border border-bg-elevated rounded px-1">m</kbd> map · <kbd className="border border-bg-elevated rounded px-1">c</kbd> calendar · <kbd className="border border-bg-elevated rounded px-1">r</kbd> rideable · <kbd className="border border-bg-elevated rounded px-1">esc</kbd> clear
        </div>

        {/* Park Cards */}
        <section ref={listRef} aria-label="Trail list" className="space-y-2.5">
          {filteredParks.map((park) => {
            const d = distances.get(park.id);
            const change = statusChanges.get(park.id);
            return (
              <div key={park.id} id={`park-${park.id}`}>
                <ParkCard
                  park={park}
                  distanceMiles={d != null ? Math.round(d) : undefined}
                  driveMinutes={d != null ? estimateDriveMinutes(d) : undefined}
                  isFavorite={favoritesSet.has(park.id)}
                  onToggleFavorite={() => toggleFavorite(park.id)}
                  isVisited={visitedSet.has(park.id)}
                  onToggleVisited={() => toggleVisited(park.id)}
                  statusChanged={change ? { from: change.from, to: change.to } : undefined}
                  forceExpanded={expandedParkId === park.id}
                  onExpanded={() => { if (expandedParkId === park.id) setExpandedParkId(null); }}
                  onNavigateToPark={scrollToPark}
                />
              </div>
            );
          })}

          {filteredParks.length === 0 && (
            <div className="text-center py-8">
              <p className="font-mono text-[13px] text-text-muted">
                No parks match your current filters.
              </p>
              <p className="font-mono text-[11px] text-text-muted/60 mt-1">
                {statusFilter && `Status: ${statusFilter}. `}
                {effectiveRegion !== 'All' && `Region: ${effectiveRegion}. `}
                {activeDifficulty !== 'All' && `Difficulty: ${activeDifficulty}. `}
                {activeTrailLength !== 'All' && `Length: ${activeTrailLength}. `}
                {prefs.showRideableOnly && 'Rideable only. '}
                {searchQuery && `Search: "${searchQuery}". `}
                Within {prefs.radiusMiles} mi.
              </p>
              <button
                onClick={() => {
                  setStatusFilter(null);
                  setActiveRegion('All');
                  setActiveDifficulty('All');
                  setActiveTrailLength('All');
                  setShowRideableOnly(false);
                  setSearchQuery('');
                }}
                className="font-mono text-[12px] text-status-open font-semibold mt-3 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* Status Logic */}
        <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mt-5">
          <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
            Status Logic
          </div>
          <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
            Parks with formal closures follow calendar-based mandatory rules. "Or as posted" means staff can extend beyond posted dates. Advisory parks have no formal closure but riders should avoid wet trails during mud season. Hunting seasons are tracked where documented. Drive times are estimates based on straight-line distance.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-bg-elevated">
          <p className="font-mono text-[11px] text-text-muted text-center">
            Ride responsibly · Respect closures · Stay off wet trails · Support your local trail org
          </p>
          {hasAnyConditions() && (
            <p className="font-mono text-[10px] text-text-muted/50 text-center mt-1">
              Conditions last updated: {new Date(getLastScrapedAt()!).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}

export default App;
