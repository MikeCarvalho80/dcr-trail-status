import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage for this test
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
});

describe('whatsNew', () => {
  beforeEach(async () => {
    Object.keys(store).forEach((k) => delete store[k]);
    // Re-import module fresh each test to reset module-level cache
    vi.resetModules();
  });

  it('first visit marks all parks as known (no new)', async () => {
    const { getNewParkIds } = await import('../lib/whatsNew');
    const newIds = getNewParkIds();
    expect(newIds.size).toBe(0);
  });

  it('getNewParkCount returns 0 on first visit', async () => {
    const { getNewParkIds, getNewParkCount } = await import('../lib/whatsNew');
    getNewParkIds();
    expect(getNewParkCount()).toBe(0);
  });

  it('isParkNew returns false on first visit', async () => {
    const { getNewParkIds, isParkNew } = await import('../lib/whatsNew');
    getNewParkIds();
    expect(isParkNew('blue-hills')).toBe(false);
  });

  it('saves known parks to localStorage', async () => {
    const { getNewParkIds } = await import('../lib/whatsNew');
    getNewParkIds();
    const stored = store['dcr-trail-known-parks'];
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(parsed.length).toBeGreaterThan(0);
  });
});
