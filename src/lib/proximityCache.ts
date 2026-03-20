import { PARKS } from '../data/parks';
import { haversineDistance } from './geo';

interface NearbyEntry {
  parkId: string;
  dist: number;
}

/**
 * Precomputed sparse proximity matrix.
 * For each park, stores up to 5 nearest parks within 15 miles.
 * Computed once at module load time (~14,000 distance calculations for 119 parks).
 */
const NEARBY_CACHE: Map<string, NearbyEntry[]> = new Map();

function buildCache() {
  for (const park of PARKS) {
    const nearby: NearbyEntry[] = [];
    for (const other of PARKS) {
      if (other.id === park.id) continue;
      const dist = haversineDistance(park.lat, park.lng, other.lat, other.lng);
      if (dist <= 15) {
        nearby.push({ parkId: other.id, dist });
      }
    }
    nearby.sort((a, b) => a.dist - b.dist);
    NEARBY_CACHE.set(park.id, nearby.slice(0, 5));
  }
}

buildCache();

/**
 * Get nearby parks from the precomputed cache.
 * Returns up to 5 parks within 15 miles, sorted by distance.
 */
export function getNearbyParks(parkId: string): NearbyEntry[] {
  return NEARBY_CACHE.get(parkId) ?? [];
}
