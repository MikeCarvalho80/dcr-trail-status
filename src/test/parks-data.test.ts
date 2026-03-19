import { describe, it, expect } from 'vitest';
import { PARKS } from '../data/parks';
import type { Region } from '../data/parks';

describe('Park data integrity', () => {
  it('has at least 30 parks', () => {
    expect(PARKS.length).toBeGreaterThanOrEqual(30);
  });

  it('every park has all required fields', () => {
    for (const park of PARKS) {
      expect(park.id, `${park.name} missing id`).toBeTruthy();
      expect(park.name, `${park.id} missing name`).toBeTruthy();
      expect(park.region, `${park.id} missing region`).toBeTruthy();
      expect(park.state, `${park.id} missing state`).toBeTruthy();
      expect(park.manager, `${park.id} missing manager`).toBeTruthy();
      expect(park.url, `${park.id} missing url`).toBeTruthy();
      expect(typeof park.lat, `${park.id} lat not number`).toBe('number');
      expect(typeof park.lng, `${park.id} lng not number`).toBe('number');
      expect(park.parking, `${park.id} missing parking`).toBeTruthy();
      expect(['formal', 'seasonal', 'advisory']).toContain(park.closureType);
      expect(park.closureRule, `${park.id} missing closureRule`).toBeTruthy();
      expect(park.difficulty, `${park.id} missing difficulty`).toBeTruthy();
      expect(park.miles, `${park.id} missing miles`).toBeTruthy();
      expect(park.nemba, `${park.id} missing nemba`).toBeTruthy();
      expect(park.lastVerified, `${park.id} missing lastVerified`).toBeTruthy();
    }
  });

  it('every park has unique id', () => {
    const ids = PARKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every park has valid coordinates in New England range', () => {
    for (const park of PARKS) {
      // New England roughly: lat 41-45, lng -73 to -69
      expect(park.lat, `${park.id} lat out of range`).toBeGreaterThan(40);
      expect(park.lat, `${park.id} lat out of range`).toBeLessThan(46);
      expect(park.lng, `${park.id} lng out of range`).toBeGreaterThan(-74);
      expect(park.lng, `${park.id} lng out of range`).toBeLessThan(-69);
    }
  });

  it('formal/seasonal parks have closure dates, advisory parks do not', () => {
    for (const park of PARKS) {
      if (park.closureType === 'advisory') {
        expect(park.closureStart, `${park.id} advisory park should not have closureStart`).toBeNull();
        expect(park.closureEnd, `${park.id} advisory park should not have closureEnd`).toBeNull();
      } else {
        expect(park.closureStart, `${park.id} ${park.closureType} park missing closureStart`).not.toBeNull();
        expect(park.closureEnd, `${park.id} ${park.closureType} park missing closureEnd`).not.toBeNull();
      }
    }
  });

  it('closure dates have valid month (1-12) and day (1-31)', () => {
    for (const park of PARKS) {
      if (park.closureStart) {
        expect(park.closureStart.month).toBeGreaterThanOrEqual(1);
        expect(park.closureStart.month).toBeLessThanOrEqual(12);
        expect(park.closureStart.day).toBeGreaterThanOrEqual(1);
        expect(park.closureStart.day).toBeLessThanOrEqual(31);
      }
      if (park.closureEnd) {
        expect(park.closureEnd.month).toBeGreaterThanOrEqual(1);
        expect(park.closureEnd.month).toBeLessThanOrEqual(12);
        expect(park.closureEnd.day).toBeGreaterThanOrEqual(1);
        expect(park.closureEnd.day).toBeLessThanOrEqual(31);
      }
    }
  });

  it('does not contain Cape & Islands region', () => {
    const regions = new Set(PARKS.map((p) => p.region));
    expect(regions.has('Cape & Islands' as Region)).toBe(false);
  });

  it('every region has at least one park', () => {
    const allRegions: Region[] = [
      'Greater Boston', 'South Shore', 'North Shore', 'MetroWest',
      'Central MA', 'Pioneer Valley', 'Berkshires',
      'Southern NH', 'Rhode Island', 'Connecticut', 'Southern VT',
    ];
    const parksPerRegion = new Map<string, number>();
    for (const park of PARKS) {
      parksPerRegion.set(park.region, (parksPerRegion.get(park.region) ?? 0) + 1);
    }
    for (const region of allRegions) {
      expect(parksPerRegion.get(region), `${region} has no parks`).toBeGreaterThanOrEqual(1);
    }
  });

  it('parks with formal closures have source attribution', () => {
    const formalParks = PARKS.filter((p) => p.closureType === 'formal' || p.closureType === 'seasonal');
    for (const park of formalParks) {
      expect(park.source, `${park.id} (${park.closureType}) missing source`).toBeTruthy();
    }
  });

  it('lastVerified is a valid ISO date string', () => {
    for (const park of PARKS) {
      const date = new Date(park.lastVerified);
      expect(date.toString(), `${park.id} has invalid lastVerified: ${park.lastVerified}`).not.toBe('Invalid Date');
    }
  });

  it('url starts with https://', () => {
    for (const park of PARKS) {
      expect(park.url, `${park.id} url not https`).toMatch(/^https:\/\//);
    }
  });
});
