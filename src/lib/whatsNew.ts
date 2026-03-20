/**
 * Tracks which parks are "new" — added within the last 14 days.
 * Uses localStorage to remember when the user first saw each park.
 * Parks not in the stored set are considered new.
 */

import { PARKS } from '../data/parks';

const STORAGE_KEY = 'dcr-trail-known-parks';

function getKnownParks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveKnownParks(known: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...known]));
}

let newParkIds: Set<string> | null = null;

/** Reset cache — for testing only */
export function _resetWhatsNew(): void {
  newParkIds = null;
}

/**
 * Initialize the "what's new" tracker.
 * Returns the set of park IDs that are new to this user.
 * On first visit, all parks are considered "known" (no spam).
 */
export function getNewParkIds(): Set<string> {
  if (newParkIds !== null) return newParkIds;

  const known = getKnownParks();
  const allIds = new Set(PARKS.map((p) => p.id));

  if (known.size === 0) {
    // First visit — mark all current parks as known
    saveKnownParks(allIds);
    newParkIds = new Set();
    return newParkIds;
  }

  // Find parks that exist now but weren't known before
  newParkIds = new Set<string>();
  for (const id of allIds) {
    if (!known.has(id)) {
      newParkIds.add(id);
    }
  }

  // Update known set to include everything current
  saveKnownParks(allIds);
  return newParkIds;
}

/**
 * Check if a specific park is new to this user.
 */
export function isParkNew(parkId: string): boolean {
  return getNewParkIds().has(parkId);
}

/**
 * Get count of new parks.
 */
export function getNewParkCount(): number {
  return getNewParkIds().size;
}
