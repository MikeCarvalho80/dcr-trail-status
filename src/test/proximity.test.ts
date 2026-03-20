import { describe, it, expect } from 'vitest';
import { getNearbyParks } from '../lib/proximityCache';
import { PARKS } from '../data/parks';

describe('proximityCache', () => {
  it('returns an array for any park ID', () => {
    const result = getNearbyParks('blue-hills');
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array for unknown park ID', () => {
    expect(getNearbyParks('nonexistent')).toEqual([]);
  });

  it('nearby parks are within 15 miles', () => {
    for (const park of PARKS.slice(0, 20)) {
      const nearby = getNearbyParks(park.id);
      for (const n of nearby) {
        expect(n.dist, `${park.id} → ${n.parkId}`).toBeLessThanOrEqual(15);
      }
    }
  });

  it('nearby parks are sorted by distance', () => {
    for (const park of PARKS.slice(0, 20)) {
      const nearby = getNearbyParks(park.id);
      for (let i = 1; i < nearby.length; i++) {
        expect(nearby[i].dist).toBeGreaterThanOrEqual(nearby[i - 1].dist);
      }
    }
  });

  it('does not include self in nearby', () => {
    for (const park of PARKS.slice(0, 20)) {
      const nearby = getNearbyParks(park.id);
      expect(nearby.find((n) => n.parkId === park.id)).toBeUndefined();
    }
  });

  it('returns at most 5 parks', () => {
    for (const park of PARKS) {
      expect(getNearbyParks(park.id).length).toBeLessThanOrEqual(5);
    }
  });

  it('Blue Hills has nearby parks (dense Boston area)', () => {
    const nearby = getNearbyParks('blue-hills');
    expect(nearby.length).toBeGreaterThan(0);
  });
});
