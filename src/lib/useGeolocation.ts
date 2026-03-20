import { useEffect, useRef } from 'react';
import { ZIP_CENTROIDS } from '../data/zipcodes';
import { haversineDistance } from './geo';

/**
 * On first load, request device location and find the nearest ZIP code.
 * Only runs once, and only if the user hasn't already set a custom ZIP.
 */
export function useGeolocation(
  currentZip: string,
  defaultZip: string,
  setZipCode: (zip: string) => void,
) {
  const attempted = useRef(false);

  useEffect(() => {
    // Only auto-detect if user is still on the default ZIP
    if (attempted.current || currentZip !== defaultZip) return;
    attempted.current = true;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let bestZip = defaultZip;
        let bestDist = Infinity;

        for (const [zip, coords] of Object.entries(ZIP_CENTROIDS)) {
          const dist = haversineDistance(latitude, longitude, coords.lat, coords.lng);
          if (dist < bestDist) {
            bestDist = dist;
            bestZip = zip;
          }
        }

        if (bestZip !== defaultZip && bestDist < 50) {
          setZipCode(bestZip);
        }
      },
      () => {
        // Permission denied or error — silently stay on default
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, [currentZip, defaultZip, setZipCode]);
}
