import { useState, useEffect } from 'react';

export interface UserPrefs {
  zipCode: string;
  radiusMiles: number;
  favorites: string[];
  showRideableOnly: boolean;
  visited: string[];
}

const STORAGE_KEY = 'dcr-trail-prefs';

const DEFAULTS: UserPrefs = {
  zipCode: '02136', // Hyde Park, Boston
  radiusMiles: 60,
  favorites: [],
  showRideableOnly: false,
  visited: [],
};

function load(): UserPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULTS;
}

function save(prefs: UserPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useUserPrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(load);

  useEffect(() => {
    save(prefs);
  }, [prefs]);

  const setZipCode = (zipCode: string) => setPrefs((p) => ({ ...p, zipCode }));
  const setRadius = (radiusMiles: number) => setPrefs((p) => ({ ...p, radiusMiles }));
  const toggleFavorite = (parkId: string) =>
    setPrefs((p) => ({
      ...p,
      favorites: p.favorites.includes(parkId)
        ? p.favorites.filter((id) => id !== parkId)
        : [...p.favorites, parkId],
    }));
  const setShowRideableOnly = (showRideableOnly: boolean) =>
    setPrefs((p) => ({ ...p, showRideableOnly }));
  const toggleVisited = (parkId: string) =>
    setPrefs((p) => ({
      ...p,
      visited: p.visited.includes(parkId)
        ? p.visited.filter((id) => id !== parkId)
        : [...p.visited, parkId],
    }));

  return { prefs, setZipCode, setRadius, toggleFavorite, setShowRideableOnly, toggleVisited };
}
