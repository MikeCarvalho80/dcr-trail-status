import { describe, it, expect } from 'vitest';
import { haversineDistance, estimateDriveMinutes } from '../lib/geo';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(42.0, -71.0, 42.0, -71.0)).toBe(0);
  });

  it('calculates reasonable Boston to NYC distance (~190 mi)', () => {
    const dist = haversineDistance(42.3601, -71.0589, 40.7128, -74.0060);
    expect(dist).toBeGreaterThan(180);
    expect(dist).toBeLessThan(200);
  });

  it('calculates reasonable Boston to Blue Hills distance (~8 mi)', () => {
    const dist = haversineDistance(42.3601, -71.0589, 42.2163, -71.1086);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(15);
  });

  it('returns positive values regardless of direction', () => {
    const dist = haversineDistance(40.0, -74.0, 42.0, -71.0);
    expect(dist).toBeGreaterThan(0);
  });
});

describe('estimateDriveMinutes', () => {
  it('returns a positive number', () => {
    expect(estimateDriveMinutes(10)).toBeGreaterThan(0);
  });

  it('increases with distance', () => {
    const short = estimateDriveMinutes(10);
    const long = estimateDriveMinutes(100);
    expect(long).toBeGreaterThan(short);
  });

  it('returns 0 for 0 miles', () => {
    expect(estimateDriveMinutes(0)).toBe(0);
  });

  it('applies winding factor (result > straight-line at 45mph)', () => {
    // 45 miles at 45 mph = 60 min, but winding factor should make it more
    const result = estimateDriveMinutes(45);
    expect(result).toBeGreaterThan(60);
  });
});
