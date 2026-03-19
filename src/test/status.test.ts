import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTrailStatus, getSeasonInfo, sortByStatusAndDistance } from '../lib/status';
import type { Park } from '../data/parks';

function makePark(overrides: Partial<Park> = {}): Park {
  return {
    id: 'test-park',
    name: 'Test Park',
    region: 'Greater Boston',
    state: 'MA',
    manager: 'DCR',
    url: 'https://example.com',
    lat: 42.0,
    lng: -71.0,
    parking: '123 Main St',
    closureType: 'advisory',
    closureRule: 'No formal closure',
    closureStart: null,
    closureEnd: null,
    notes: 'Test notes',
    difficulty: 'Intermediate',
    miles: '10+',
    nemba: 'Test Chapter',
    lastVerified: '2026-03-19',
    ...overrides,
  };
}

describe('getTrailStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('advisory parks (no closure dates)', () => {
    const park = makePark();

    it('returns caution/Mud Season during March', () => {
      vi.setSystemTime(new Date(2026, 2, 15)); // March 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('caution');
      expect(result.label).toBe('Mud Season');
      expect(result.reason).toContain('no posted closure dates');
    });

    it('returns caution/Mud Season during early April (before Apr 11)', () => {
      vi.setSystemTime(new Date(2026, 3, 8)); // April 8
      const result = getTrailStatus(park);
      expect(result.status).toBe('caution');
      expect(result.label).toBe('Mud Season');
    });

    it('returns open/Likely Open after April 15', () => {
      vi.setSystemTime(new Date(2026, 3, 16)); // April 16
      const result = getTrailStatus(park);
      expect(result.status).toBe('open');
      expect(result.label).toBe('Likely Open');
    });

    it('returns open during summer', () => {
      vi.setSystemTime(new Date(2026, 6, 15)); // July 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('open');
    });

    it('returns open during winter (no closure dates)', () => {
      vi.setSystemTime(new Date(2026, 0, 15)); // January 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('open');
    });
  });

  describe('formal closure parks', () => {
    const park = makePark({
      id: 'blue-hills',
      closureType: 'formal',
      closureRule: 'March 1 - March 31 (DCR mandate)',
      closureStart: { month: 3, day: 1 },
      closureEnd: { month: 3, day: 31 },
    });

    it('returns closed during closure window', () => {
      vi.setSystemTime(new Date(2026, 2, 15)); // March 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('closed');
      expect(result.label).toBe('Closed');
      expect(result.sublabel).toContain('remaining');
      expect(result.sublabel).toContain('mandatory');
    });

    it('returns closed on first day of closure', () => {
      vi.setSystemTime(new Date(2026, 2, 1)); // March 1
      const result = getTrailStatus(park);
      expect(result.status).toBe('closed');
    });

    it('returns closed on last day of closure', () => {
      vi.setSystemTime(new Date(2026, 2, 31)); // March 31
      const result = getTrailStatus(park);
      expect(result.status).toBe('closed');
    });

    it('returns caution/Recently Reopened within 2 weeks after closure end', () => {
      vi.setSystemTime(new Date(2026, 3, 5)); // April 5
      const result = getTrailStatus(park);
      expect(result.status).toBe('caution');
      expect(result.label).toBe('Recently Reopened');
      expect(result.reason).toContain('within two weeks');
    });

    it('returns open well after closure', () => {
      vi.setSystemTime(new Date(2026, 5, 15)); // June 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('open');
      expect(result.label).toBe('Open');
    });

    it('reason includes closure date range', () => {
      vi.setSystemTime(new Date(2026, 2, 15));
      const result = getTrailStatus(park);
      expect(result.reason).toContain('3/1');
      expect(result.reason).toContain('3/31');
    });
  });

  describe('seasonal closure parks', () => {
    const park = makePark({
      id: 'great-brook',
      closureType: 'seasonal',
      closureRule: 'Winter: trails for XC skiing (Dec-Mar)',
      closureStart: { month: 12, day: 1 },
      closureEnd: { month: 3, day: 15 },
    });

    it('returns closed during cross-year closure (January)', () => {
      vi.setSystemTime(new Date(2026, 0, 15)); // January 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('closed');
      expect(result.sublabel).toContain('seasonal use');
    });

    it('returns closed in December', () => {
      vi.setSystemTime(new Date(2025, 11, 15)); // December 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('closed');
    });

    it('returns open after closure end + 2 weeks', () => {
      vi.setSystemTime(new Date(2026, 3, 15)); // April 15
      const result = getTrailStatus(park);
      expect(result.status).toBe('open');
    });
  });

  describe('"or as posted" closures', () => {
    const park = makePark({
      closureType: 'formal',
      closureRule: 'March 1 - March 31 or as posted (DCR mandate)',
      closureStart: { month: 3, day: 1 },
      closureEnd: { month: 3, day: 31 },
    });

    it('includes "may extend" in sublabel during closure', () => {
      vi.setSystemTime(new Date(2026, 2, 15));
      const result = getTrailStatus(park);
      expect(result.sublabel).toContain('may extend');
    });
  });

  describe('reason field', () => {
    it('every status result includes a non-empty reason', () => {
      const park = makePark();
      vi.setSystemTime(new Date(2026, 6, 15));
      const result = getTrailStatus(park);
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(20);
    });
  });
});

describe('getSeasonInfo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns spring season in March', () => {
    vi.setSystemTime(new Date(2026, 2, 1));
    const info = getSeasonInfo();
    expect(info.season).toBe('spring');
  });

  it('returns 0% on March 1', () => {
    vi.setSystemTime(new Date(2026, 2, 1));
    const info = getSeasonInfo() as any;
    expect(info.pct).toBeCloseTo(0, 0);
    expect(info.inClosure).toBe(true);
  });

  it('returns 100% on May 31', () => {
    vi.setSystemTime(new Date(2026, 4, 31));
    const info = getSeasonInfo() as any;
    expect(info.pct).toBeCloseTo(100, 0);
  });

  it('closureEndPct represents April 1 within Mar 1 - May 31 range', () => {
    vi.setSystemTime(new Date(2026, 2, 15));
    const info = getSeasonInfo() as any;
    // Apr 1 is 31 days into a 91-day range ≈ 34%
    expect(info.closureEndPct).toBeGreaterThan(30);
    expect(info.closureEndPct).toBeLessThan(40);
  });

  it('cautionEndPct represents April 15', () => {
    vi.setSystemTime(new Date(2026, 2, 15));
    const info = getSeasonInfo() as any;
    // Apr 15 is 45 days into 91-day range ≈ 49%
    expect(info.cautionEndPct).toBeGreaterThan(45);
    expect(info.cautionEndPct).toBeLessThan(55);
  });

  it('inClosure is true during March', () => {
    vi.setSystemTime(new Date(2026, 2, 20));
    const info = getSeasonInfo() as any;
    expect(info.inClosure).toBe(true);
    expect(info.inCaution).toBe(false);
  });

  it('inCaution is true during April 1-14', () => {
    vi.setSystemTime(new Date(2026, 3, 10));
    const info = getSeasonInfo() as any;
    expect(info.inClosure).toBe(false);
    expect(info.inCaution).toBe(true);
  });

  it('neither inClosure nor inCaution after April 15', () => {
    vi.setSystemTime(new Date(2026, 3, 20));
    const info = getSeasonInfo() as any;
    expect(info.inClosure).toBe(false);
    expect(info.inCaution).toBe(false);
  });

  it('returns fall season in October', () => {
    vi.setSystemTime(new Date(2026, 9, 15));
    const info = getSeasonInfo();
    expect(info.season).toBe('fall');
  });

  it('returns summer season in July', () => {
    vi.setSystemTime(new Date(2026, 6, 15));
    const info = getSeasonInfo();
    expect(info.season).toBe('summer');
  });

  it('returns winter season in January', () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    const info = getSeasonInfo();
    expect(info.season).toBe('winter');
  });
});

describe('sortByStatusAndDistance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15 — some parks closed
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sorts closed parks before open parks', () => {
    const closed = makePark({
      id: 'closed-park',
      closureType: 'formal',
      closureStart: { month: 3, day: 1 },
      closureEnd: { month: 3, day: 31 },
    });
    const open = makePark({ id: 'open-park' }); // advisory = caution in March
    const distances = new Map([['closed-park', 100], ['open-park', 10]]);

    const sorted = sortByStatusAndDistance([open, closed], distances);
    expect(sorted[0].id).toBe('closed-park');
  });

  it('sorts by distance within same status', () => {
    const near = makePark({ id: 'near' });
    const far = makePark({ id: 'far' });
    const distances = new Map([['near', 10], ['far', 50]]);

    const sorted = sortByStatusAndDistance([far, near], distances);
    expect(sorted[0].id).toBe('near');
    expect(sorted[1].id).toBe('far');
  });

  it('pins favorites to top when provided', () => {
    const fav = makePark({ id: 'fav' });
    const notFav = makePark({ id: 'not-fav' });
    const distances = new Map([['fav', 100], ['not-fav', 10]]);
    const favorites = new Set(['fav']);

    const sorted = sortByStatusAndDistance([notFav, fav], distances, favorites);
    expect(sorted[0].id).toBe('fav');
  });

  it('does not change order when favorites set is empty', () => {
    const a = makePark({ id: 'a' });
    const b = makePark({ id: 'b' });
    const distances = new Map([['a', 10], ['b', 50]]);

    const sorted = sortByStatusAndDistance([b, a], distances, new Set());
    expect(sorted[0].id).toBe('a');
  });
});
