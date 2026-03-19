import { describe, it, expect } from 'vitest';
import { parseMiles, matchesLengthRange } from '../lib/parks-utils';
import type { TrailLengthFilter } from '../lib/parks-utils';
import { PARKS } from '../data/parks';

describe('parseMiles', () => {
  it('parses "5+" to 5', () => {
    expect(parseMiles('5+')).toBe(5);
  });

  it('parses "20+" to 20', () => {
    expect(parseMiles('20+')).toBe(20);
  });

  it('parses "6.5" to 6.5', () => {
    expect(parseMiles('6.5')).toBe(6.5);
  });

  it('parses "12+ paved" to 12', () => {
    expect(parseMiles('12+ paved')).toBe(12);
  });

  it('parses "100+" to 100', () => {
    expect(parseMiles('100+')).toBe(100);
  });

  it('returns 0 for empty string', () => {
    expect(parseMiles('')).toBe(0);
  });

  it('parses every park miles field to a positive number', () => {
    for (const park of PARKS) {
      const miles = parseMiles(park.miles);
      expect(miles, `${park.id} miles "${park.miles}" parsed to ${miles}`).toBeGreaterThan(0);
    }
  });
});

describe('matchesLengthRange', () => {
  it('"All" matches everything', () => {
    expect(matchesLengthRange(5, 'All')).toBe(true);
    expect(matchesLengthRange(100, 'All')).toBe(true);
  });

  it('"<10" matches under 10', () => {
    expect(matchesLengthRange(5, '<10')).toBe(true);
    expect(matchesLengthRange(9.9, '<10')).toBe(true);
    expect(matchesLengthRange(10, '<10')).toBe(false);
    expect(matchesLengthRange(15, '<10')).toBe(false);
  });

  it('"10-25" matches 10 through 25', () => {
    expect(matchesLengthRange(10, '10-25')).toBe(true);
    expect(matchesLengthRange(20, '10-25')).toBe(true);
    expect(matchesLengthRange(25, '10-25')).toBe(true);
    expect(matchesLengthRange(9, '10-25')).toBe(false);
    expect(matchesLengthRange(26, '10-25')).toBe(false);
  });

  it('"25-50" matches 26 through 50', () => {
    expect(matchesLengthRange(30, '25-50')).toBe(true);
    expect(matchesLengthRange(50, '25-50')).toBe(true);
    expect(matchesLengthRange(25, '25-50')).toBe(false);
  });

  it('"50+" matches over 50', () => {
    expect(matchesLengthRange(60, '50+')).toBe(true);
    expect(matchesLengthRange(100, '50+')).toBe(true);
    expect(matchesLengthRange(50, '50+')).toBe(false);
  });

  it('every park can be matched by at least one non-All filter', () => {
    const filters: TrailLengthFilter[] = ['<10', '10-25', '25-50', '50+'];
    for (const park of PARKS) {
      const miles = parseMiles(park.miles);
      const matched = filters.some((f) => matchesLengthRange(miles, f));
      expect(matched, `${park.id} (${miles} mi) matches no filter`).toBe(true);
    }
  });
});
