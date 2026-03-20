import { useState, useEffect } from 'react';
import { fetchWeather } from './weather';
import type { ParkWeather } from './weather';

/**
 * Fetches NWS weather for a park. Only triggers when isActive=true.
 * Caches per parkId so expand/collapse doesn't re-fetch.
 */
export function useWeather(parkId: string, lat: number, lng: number, isActive: boolean) {
  const [weather, setWeather] = useState<ParkWeather | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    setLoading(true);

    fetchWeather(parkId, lat, lng).then((data) => {
      if (!cancelled) {
        setWeather(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [parkId, lat, lng, isActive]);

  return { weather, loading };
}
