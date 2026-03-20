import { useState, useEffect, useRef, useCallback } from 'react';
import { syncUserPrefs, pushPrefsDebounced } from './syncPrefs';

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
  const syncedRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage on every change
  useEffect(() => {
    save(prefs);
  }, [prefs]);

  // On mount: pull remote prefs and merge
  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    syncUserPrefs(load()).then((merged) => {
      if (merged) {
        setPrefs((current) => ({
          ...current,
          favorites: [...new Set([...current.favorites, ...merged.favorites])],
          visited: [...new Set([...current.visited, ...merged.visited])],
        }));
      }
    });
  }, []);

  // Debounced push to Supabase on favorites/visited changes
  const pushToRemote = useCallback((updated: UserPrefs) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushPrefsDebounced(updated);
    }, 500);
  }, []);

  const setZipCode = (zipCode: string) => setPrefs((p) => ({ ...p, zipCode }));
  const setRadius = (radiusMiles: number) => setPrefs((p) => ({ ...p, radiusMiles }));
  const toggleFavorite = (parkId: string) =>
    setPrefs((p) => {
      const updated = {
        ...p,
        favorites: p.favorites.includes(parkId)
          ? p.favorites.filter((id) => id !== parkId)
          : [...p.favorites, parkId],
      };
      pushToRemote(updated);
      return updated;
    });
  const setShowRideableOnly = (showRideableOnly: boolean) =>
    setPrefs((p) => ({ ...p, showRideableOnly }));
  const toggleVisited = (parkId: string) =>
    setPrefs((p) => {
      const updated = {
        ...p,
        visited: p.visited.includes(parkId)
          ? p.visited.filter((id) => id !== parkId)
          : [...p.visited, parkId],
      };
      pushToRemote(updated);
      return updated;
    });

  return { prefs, setZipCode, setRadius, toggleFavorite, setShowRideableOnly, toggleVisited };
}
