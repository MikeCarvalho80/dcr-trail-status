import { useEffect } from 'react';
import type { FilterOption } from '../components/RegionFilters';
import type { StatusFilter } from '../components/SummaryStats';
import type { DifficultyFilter, TrailLengthFilter } from './parks-utils';
import type { TrailStatus } from '../data/parks';

interface UrlState {
  zip?: string;
  radius?: number;
  region?: FilterOption;
  difficulty?: DifficultyFilter;
  length?: TrailLengthFilter;
  search?: string;
  rideable?: boolean;
  status?: StatusFilter;
}

export function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const state: UrlState = {};
  const zip = params.get('zip');
  if (zip && /^\d{5}$/.test(zip)) state.zip = zip;
  const radius = params.get('radius');
  if (radius) {
    const n = parseInt(radius, 10);
    if (!isNaN(n) && n > 0) state.radius = n;
  }
  const region = params.get('region');
  if (region) state.region = region as FilterOption;
  const difficulty = params.get('difficulty');
  if (difficulty) state.difficulty = difficulty as DifficultyFilter;
  const length = params.get('length');
  if (length) state.length = length as TrailLengthFilter;
  const search = params.get('search');
  if (search) state.search = search;
  const rideable = params.get('rideable');
  if (rideable === '1') state.rideable = true;
  const status = params.get('status');
  if (status && ['open', 'caution', 'closed'].includes(status)) state.status = status as TrailStatus;
  return state;
}

export function useUrlSync(state: {
  zipCode: string;
  radiusMiles: number;
  activeRegion: FilterOption;
  activeDifficulty: DifficultyFilter;
  activeTrailLength: TrailLengthFilter;
  searchQuery: string;
  showRideableOnly: boolean;
  statusFilter: StatusFilter;
}) {
  useEffect(() => {
    const params = new URLSearchParams();
    if (state.zipCode !== '02136') params.set('zip', state.zipCode);
    if (state.radiusMiles !== 60) params.set('radius', String(state.radiusMiles));
    if (state.activeRegion !== 'All') params.set('region', state.activeRegion);
    if (state.activeDifficulty !== 'All') params.set('difficulty', state.activeDifficulty);
    if (state.activeTrailLength !== 'All') params.set('length', state.activeTrailLength);
    if (state.searchQuery) params.set('search', state.searchQuery);
    if (state.showRideableOnly) params.set('rideable', '1');
    if (state.statusFilter) params.set('status', state.statusFilter);

    const search = params.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [
    state.zipCode,
    state.radiusMiles,
    state.activeRegion,
    state.activeDifficulty,
    state.activeTrailLength,
    state.searchQuery,
    state.showRideableOnly,
    state.statusFilter,
  ]);
}
