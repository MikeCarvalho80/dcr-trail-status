import { supabase } from './supabase';

let cachedUserId: string | null = null;

/**
 * Ensures an anonymous Supabase auth session exists.
 * Caches the user ID for the lifetime of the tab.
 */
export async function ensureAnonAuth(): Promise<string | null> {
  if (!supabase) return null;
  if (cachedUserId) return cachedUserId;

  // Check for an existing session first
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    cachedUserId = session.user.id;
    return cachedUserId;
  }

  // No session — sign in anonymously
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.warn('[anonAuth] Failed to sign in anonymously:', error?.message);
    return null;
  }

  cachedUserId = data.user.id;
  return cachedUserId;
}

/**
 * Returns the cached anonymous user ID, or null if not yet authenticated.
 */
export function getAnonUserId(): string | null {
  return cachedUserId;
}
