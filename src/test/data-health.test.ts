import { describe, it, expect } from 'vitest';
import { isParkStale, isParkUrlBroken, getStaleCount, getBrokenCount } from '../lib/dataHealth';
import { PARKS } from '../data/parks';

describe('dataHealth', () => {
  it('isParkStale returns false for recently verified parks', () => {
    // All parks were verified on 2026-03-19, which is < 90 days ago
    const recentPark = PARKS.find((p) => p.lastVerified === '2026-03-19');
    if (recentPark) {
      expect(isParkStale(recentPark.id)).toBe(false);
    }
  });

  it('isParkStale returns false for unknown park IDs', () => {
    expect(isParkStale('nonexistent-park')).toBe(false);
  });

  it('getStaleCount returns a number', () => {
    expect(typeof getStaleCount()).toBe('number');
    expect(getStaleCount()).toBeGreaterThanOrEqual(0);
  });

  it('getBrokenCount returns a number', () => {
    expect(typeof getBrokenCount()).toBe('number');
    expect(getBrokenCount()).toBeGreaterThanOrEqual(0);
  });

  it('isParkUrlBroken returns a boolean', () => {
    expect(typeof isParkUrlBroken('blue-hills')).toBe('boolean');
  });

  it('every park has a lastVerified date', () => {
    for (const park of PARKS) {
      expect(park.lastVerified, `${park.id} missing lastVerified`).toBeTruthy();
      const d = new Date(park.lastVerified);
      expect(d.toString()).not.toBe('Invalid Date');
    }
  });
});
