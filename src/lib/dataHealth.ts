import healthData from '../data/health.json';
import { PARKS } from '../data/parks';

interface HealthEntry {
  url: string;
  status: number;
  checkedAt: string;
}

const health = healthData as Record<string, HealthEntry>;

/**
 * Check if a park's source URL is broken (404 or unreachable).
 */
export function isParkUrlBroken(parkId: string): boolean {
  return parkId in health;
}

/**
 * Get all parks with broken URLs.
 */
export function getBrokenUrlParks(): { parkId: string; url: string; status: number }[] {
  return Object.entries(health).map(([parkId, entry]) => ({
    parkId,
    url: entry.url,
    status: entry.status,
  }));
}

/**
 * Check if a park's data is stale (lastVerified > 90 days ago).
 */
export function isParkStale(parkId: string): boolean {
  const park = PARKS.find((p) => p.id === parkId);
  if (!park) return false;
  const verified = new Date(park.lastVerified).getTime();
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return verified < ninetyDaysAgo;
}

/**
 * Get count of stale parks.
 */
export function getStaleCount(): number {
  return PARKS.filter((p) => isParkStale(p.id)).length;
}

/**
 * Get count of parks with broken URLs.
 */
export function getBrokenCount(): number {
  return Object.keys(health).length;
}
