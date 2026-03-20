import { supabase, isSupabaseConfigured } from './supabase';
import type { TrailStatus } from '../data/parks';

interface ClosureSnapshot {
  date: string;
  status: TrailStatus;
}

// Bundled fallback
let bundledHistory: { date: string; statuses: Record<string, string> }[] | null = null;

async function loadBundledHistory() {
  if (bundledHistory !== null) return bundledHistory;
  try {
    const mod = await import('../../data/closure-history.json');
    bundledHistory = mod.default as typeof bundledHistory;
  } catch {
    bundledHistory = [];
  }
  return bundledHistory!;
}

/**
 * Fetch closure history for a specific park.
 * Tries Supabase first, falls back to bundled JSON.
 */
export async function fetchClosureHistory(
  parkId: string,
  days = 90,
): Promise<ClosureSnapshot[]> {
  // Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('closure_snapshots')
        .select('snapshot_date, statuses')
        .gte('snapshot_date', cutoff)
        .order('snapshot_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data
          .map((row) => ({
            date: row.snapshot_date,
            status: (row.statuses as Record<string, string>)[parkId] as TrailStatus,
          }))
          .filter((s) => s.status != null);
      }
    } catch {
      // fall through to bundled
    }
  }

  // Fallback: bundled JSON
  const history = await loadBundledHistory();
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  return history
    .filter((entry) => new Date(entry.date).getTime() > cutoffMs)
    .map((entry) => ({
      date: entry.date,
      status: entry.statuses[parkId] as TrailStatus,
    }))
    .filter((s) => s.status != null);
}
