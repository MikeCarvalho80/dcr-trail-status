import { supabase, isSupabaseConfigured } from './supabase';
import { ensureAnonAuth } from './anonAuth';

/**
 * Get today's rider counts per park.
 */
export async function getRidingTodayCounts(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!isSupabaseConfigured || !supabase) return map;

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('riding_today')
    .select('park_id')
    .eq('ride_date', today);

  if (error || !data) return map;

  for (const row of data) {
    map.set(row.park_id, (map.get(row.park_id) || 0) + 1);
  }
  return map;
}

/**
 * Get parks the current user marked for today.
 */
export async function getMyRidesToday(): Promise<Set<string>> {
  const set = new Set<string>();
  if (!isSupabaseConfigured || !supabase) return set;

  const userId = await ensureAnonAuth();
  if (!userId) return set;

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('riding_today')
    .select('park_id')
    .eq('user_id', userId)
    .eq('ride_date', today);

  if (error || !data) return set;
  for (const row of data) set.add(row.park_id);
  return set;
}

/**
 * Toggle "riding today" for a park. Returns whether it's now active.
 */
export async function toggleRidingToday(parkId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const userId = await ensureAnonAuth();
  if (!userId) return false;

  const today = new Date().toISOString().split('T')[0];

  // Check if already marked
  const { data: existing } = await supabase
    .from('riding_today')
    .select('id')
    .eq('park_id', parkId)
    .eq('user_id', userId)
    .eq('ride_date', today)
    .single();

  if (existing) {
    await supabase.from('riding_today').delete().eq('id', existing.id);
    return false;
  }

  const { error } = await supabase
    .from('riding_today')
    .insert({ park_id: parkId, user_id: userId, ride_date: today });

  return !error;
}
