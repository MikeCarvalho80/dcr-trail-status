import { useState, useEffect } from 'react';

export interface UserPrefs {
  zipCode: string;
  radiusMiles: number;
}

const STORAGE_KEY = 'dcr-trail-prefs';

const DEFAULTS: UserPrefs = {
  zipCode: '02136', // Hyde Park, Boston
  radiusMiles: 60,
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

  return { prefs, setZipCode, setRadius };
}
