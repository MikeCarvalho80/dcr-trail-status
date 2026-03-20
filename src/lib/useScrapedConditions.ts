import { useState, useEffect, useRef } from 'react';
import { fetchLiveConditions, getParkConditions } from './conditions';
import type { ScrapedConditionReport } from './conditions';

/**
 * Hook that fetches scraped conditions from Supabase, falling back to bundled JSON.
 * Only fetches once per parkId — subsequent activations use cached data.
 */
export function useScrapedConditions(parkId: string, isActive: boolean) {
  const [conditions, setConditions] = useState<ScrapedConditionReport[]>(() =>
    getParkConditions(parkId)
  );
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Skip if not active, or already fetched for this parkId
    if (!isActive || fetchedRef.current.has(parkId)) return;

    let cancelled = false;
    setLoading(true);

    fetchLiveConditions(parkId).then((data) => {
      if (!cancelled) {
        setConditions(data);
        setLoading(false);
        fetchedRef.current.add(parkId);
      }
    });

    return () => { cancelled = true; };
  }, [parkId, isActive]);

  return { conditions, loading };
}
