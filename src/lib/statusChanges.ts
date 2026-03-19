import type { TrailStatus } from '../data/parks';

const STORAGE_KEY = 'dcr-trail-status-snapshot';

interface StatusSnapshot {
  [parkId: string]: TrailStatus;
}

export function loadSnapshot(): StatusSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSnapshot(snapshot: StatusSnapshot): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function getChangedParks(
  previous: StatusSnapshot,
  current: StatusSnapshot,
): Map<string, { from: TrailStatus; to: TrailStatus }> {
  const changes = new Map<string, { from: TrailStatus; to: TrailStatus }>();
  for (const [id, status] of Object.entries(current)) {
    const prev = previous[id];
    if (prev && prev !== status) {
      changes.set(id, { from: prev, to: status });
    }
  }
  return changes;
}
