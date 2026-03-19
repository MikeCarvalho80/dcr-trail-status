import { describe, it, expect } from 'vitest';
import { PARKS } from '../data/parks';

// Mirror the search logic from App.tsx
function searchParks(query: string) {
  const q = query.toLowerCase();
  return PARKS.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.region.toLowerCase().includes(q) ||
    p.manager.toLowerCase().includes(q) ||
    p.parking.toLowerCase().includes(q)
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
    expect(results.every((p) => p.region === 'Cape & Islands' || p.name.toLowerCase().includes('cape'))).toBe(true);
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
});
