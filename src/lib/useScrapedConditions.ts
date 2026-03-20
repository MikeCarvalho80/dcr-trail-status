import { useState, useEffect } from 'react';
import { fetchLiveConditions, getParkConditions } from './conditions';
import type { ScrapedConditionReport } from './conditions';

/**
 * Hook that fetches scraped conditions from Supabase, falling back to bundled JSON.
 * Returns conditions and loading state.
 */
export function useScrapedConditions(parkId: string, isActive: boolean) {
  const [conditions, setConditions] = useState<ScrapedConditionReport[]>(() =>
    // Sync initial value from bundled JSON for instant render
    getParkConditions(parkId)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    setLoading(true);

    fetchLiveConditions(parkId).then((data) => {
      if (!cancelled) {
        setConditions(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [parkId, isActive]);

  return { conditions, loading };
}
