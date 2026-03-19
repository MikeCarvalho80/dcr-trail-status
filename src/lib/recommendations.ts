import type { Park, TrailStatus } from '../data/parks';
import { getTrailStatus } from './status';
import { parseMiles } from './parks-utils';

interface ScoredPark {
  park: Park;
  score: number;
}

/**
 * Rank parks for "Suggested Rides" based on:
 * - Open status (must be open or caution, not closed)
 * - Distance from user (closer = better)
 * - Trail mileage (more = better for a day ride)
 * - Avoids recently reopened / mud season when better options exist
 */
export function getSuggestedRides(
  parks: Park[],
  distances: Map<string, number>,
  maxResults = 5,
): Park[] {
  const scored: ScoredPark[] = [];

  for (const park of parks) {
    const trail = getTrailStatus(park);
    if (trail.status === 'closed') continue;

    let score = 0;
    // Open parks score higher than caution
    score += trail.status === 'open' ? 50 : 20;
    // Closer parks score higher
    const dist = distances.get(park.id) ?? 999;
    score += Math.max(0, 100 - dist); // 100pts at 0mi, 0pts at 100mi+
    // More trail miles is better
    score += Math.min(parseMiles(park.miles), 50); // cap at 50pts
    // Penalty for advisory-only status
    if (trail.label === 'Mud Season') score -= 15;

    scored.push({ park, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.park);
}
