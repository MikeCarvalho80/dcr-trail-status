import { describe, it, expect } from 'vitest';
import { PARKS } from '../data/parks';
import { fuzzyMatch } from '../lib/fuzzySearch';

// Mirror the search logic from App.tsx (now using fuzzyMatch)
function searchParks(query: string) {
  if (!query.trim()) return PARKS;
  return PARKS.filter((p) =>
    fuzzyMatch(query, p.name, p.region, p.manager, p.parking)
  );
}

describe('Park search', () => {
  it('finds parks by name', () => {
    const results = searchParks('blue hills');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('blue-hills');
  });

  it('finds parks by partial name', () => {
    const results = searchParks('kingdom');
    expect(results.some((p) => p.id === 'kingdom-trails')).toBe(true);
  });

  it('finds parks by region', () => {
    const results = searchParks('cape');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds parks by manager', () => {
    const results = searchParks('NEMBA');
    expect(results.length).toBeGreaterThan(0);
  });

  it('search is case-insensitive', () => {
    const lower = searchParks('bradbury');
    const upper = searchParks('BRADBURY');
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it('empty search returns all parks', () => {
    const results = searchParks('');
    expect(results.length).toBe(PARKS.length);
  });

  it('nonsense search returns empty', () => {
    const results = searchParks('zzzzxyzzy');
    expect(results.length).toBe(0);
  });

  it('finds Acadia by name', () => {
    const results = searchParks('acadia');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('acadia-carriage-roads');
  });

  it('finds parks by parking location', () => {
    const results = searchParks('Carlisle');
    expect(results.some((p) => p.id === 'great-brook')).toBe(true);
  });

  // Fuzzy search tests
  it('matches with missing trailing characters ("blue hill" → Blue Hills)', () => {
    const results = searchParks('blue hill');
    expect(results.some((p) => p.id === 'blue-hills')).toBe(true);
  });

  it('matches multi-word queries in any order ("hills blue" → Blue Hills)', () => {
    const results = searchParks('hills blue');
    expect(results.some((p) => p.id === 'blue-hills')).toBe(true);
  });

  it('matches across fields ("kingdom vt" → name + region)', () => {
    const results = searchParks('kingdom vt');
    expect(results.some((p) => p.id === 'kingdom-trails')).toBe(true);
  });

  it('matches partial words ("harri" → Harriman)', () => {
    const results = searchParks('harri');
    expect(results.some((p) => p.id === 'harriman')).toBe(true);
  });
});

describe('fuzzyMatch', () => {
  it('empty query matches everything', () => {
    expect(fuzzyMatch('', 'anything')).toBe(true);
  });

  it('single word match', () => {
    expect(fuzzyMatch('blue', 'Blue Hills Reservation')).toBe(true);
  });

  it('multi-word all must match', () => {
    expect(fuzzyMatch('blue hills', 'Blue Hills Reservation')).toBe(true);
    expect(fuzzyMatch('blue mountain', 'Blue Hills Reservation')).toBe(false);
  });

  it('words can match across different targets', () => {
    expect(fuzzyMatch('kingdom vt', 'Kingdom Trails', 'Southern VT')).toBe(true);
  });

  it('case insensitive', () => {
    expect(fuzzyMatch('BLUE', 'blue hills')).toBe(true);
  });
});
