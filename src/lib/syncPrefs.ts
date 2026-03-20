import { supabase, isSupabaseConfigured } from './supabase';
import { ensureAnonAuth } from './anonAuth';
import type { UserPrefs } from './useUserPrefs';

interface RemotePrefs {
  favorites: string[];
  visited: string[];
}

/**
 * Pull preferences from Supabase for the current anonymous user.
 */
async function pullPrefs(): Promise<RemotePrefs | null> {
  if (!supabase) return null;
  const userId = await ensureAnonAuth();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_prefs')
    .select('favorites, visited')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    favorites: data.favorites ?? [],
    visited: data.visited ?? [],
  };
}

/**
 * Push local preferences to Supabase (upsert).
 */
async function pushPrefs(prefs: UserPrefs): Promise<void> {
  if (!supabase) return;
  const userId = await ensureAnonAuth();
  if (!userId) return;

  await supabase
    .from('user_prefs')
    .upsert({
      id: userId,
      favorites: prefs.favorites,
      visited: prefs.visited,
      updated_at: new Date().toISOString(),
    });
}

/**
 * Union merge — combines arrays without losing data from either side.
 */
function mergeArrays(local: string[], remote: string[]): string[] {
  return [...new Set([...local, ...remote])];
}

/**
 * Merge remote prefs into local prefs using union strategy.
 */
export function mergePrefs(local: UserPrefs, remote: RemotePrefs): UserPrefs {
  return {
    ...local,
    favorites: mergeArrays(local.favorites, remote.favorites),
    visited: mergeArrays(local.visited, remote.visited),
  };
}

/**
 * Full sync cycle: pull remote, merge with local, push merged result back.
 * Returns the merged prefs, or null if sync was skipped.
 */
export async function syncUserPrefs(localPrefs: UserPrefs): Promise<UserPrefs | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const remote = await pullPrefs();
    if (!remote) {
      // No remote row yet — push local to create it
      await pushPrefs(localPrefs);
      return null;
    }

    const merged = mergePrefs(localPrefs, remote);

    // Only push if something changed
    const changed =
      merged.favorites.length !== localPrefs.favorites.length ||
      merged.visited.length !== localPrefs.visited.length;

    if (changed) {
      await pushPrefs(merged);
    }

    return merged;
  } catch (err) {
    console.warn('[syncPrefs] Sync failed:', err);
    return null;
  }
}

/**
 * Push-only sync for debounced updates after local changes.
 */
export async function pushPrefsDebounced(prefs: UserPrefs): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await pushPrefs(prefs);
  } catch {
    // silent fail — local storage is the source of truth
  }
}
