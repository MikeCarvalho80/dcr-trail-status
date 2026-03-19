import { describe, it, expect } from 'vitest';
import { getZipCoords } from '../data/zipcodes';

describe('getZipCoords', () => {
  it('returns coordinates for a valid Boston ZIP', () => {
    const result = getZipCoords('02136');
    expect(result).not.toBeNull();
    expect(result!.lat).toBeGreaterThan(42);
    expect(result!.lat).toBeLessThan(43);
    expect(result!.lng).toBeGreaterThan(-72);
    expect(result!.lng).toBeLessThan(-70);
  });

  it('returns null for an invalid ZIP', () => {
    expect(getZipCoords('99999')).toBeNull();
    expect(getZipCoords('')).toBeNull();
    expect(getZipCoords('abc')).toBeNull();
  });

  it('returns coordinates for a NH ZIP', () => {
    const result = getZipCoords('03101'); // Manchester NH
    expect(result).not.toBeNull();
  });

  it('returns coordinates for a RI ZIP', () => {
    const result = getZipCoords('02903'); // Providence RI
    expect(result).not.toBeNull();
  });
});
