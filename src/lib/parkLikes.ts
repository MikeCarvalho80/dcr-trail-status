import { supabase, isSupabaseConfigured } from './supabase';
import { ensureAnonAuth } from './anonAuth';

export interface ParkLikeCounts {
  up: number;
  down: number;
}

/**
 * Get like/dislike counts for all parks.
 */
export async function getAllLikeCounts(): Promise<Map<string, ParkLikeCounts>> {
  const map = new Map<string, ParkLikeCounts>();
  if (!isSupabaseConfigured || !supabase) return map;

  const { data, error } = await supabase
    .from('park_likes')
    .select('park_id, vote');

  if (error || !data) return map;

  for (const row of data) {
    const existing = map.get(row.park_id) || { up: 0, down: 0 };
    if (row.vote === 1) existing.up++;
    else existing.down++;
    map.set(row.park_id, existing);
  }

  return map;
}

/**
 * Get the current user's votes.
 */
export async function getMyVotes(): Promise<Map<string, 1 | -1>> {
  const map = new Map<string, 1 | -1>();
  if (!isSupabaseConfigured || !supabase) return map;

  const userId = await ensureAnonAuth();
  if (!userId) return map;

  const { data, error } = await supabase
    .from('park_likes')
    .select('park_id, vote')
    .eq('user_id', userId);

  if (error || !data) return map;

  for (const row of data) {
    map.set(row.park_id, row.vote as 1 | -1);
  }

  return map;
}

/**
 * Vote on a park. Toggles off if same vote, switches if different.
 * Returns the new vote state (1, -1, or null for removed).
 */
export async function votePark(parkId: string, vote: 1 | -1): Promise<{ newVote: 1 | -1 | null; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { newVote: null, error: 'Not configured' };

  const userId = await ensureAnonAuth();
  if (!userId) return { newVote: null, error: 'Auth failed' };

  // Check existing vote
  const { data: existing } = await supabase
    .from('park_likes')
    .select('id, vote')
    .eq('park_id', parkId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    if (existing.vote === vote) {
      // Same vote — remove it (toggle off)
      await supabase.from('park_likes').delete().eq('id', existing.id);
      return { newVote: null };
    } else {
      // Different vote — update
      await supabase.from('park_likes').update({ vote }).eq('id', existing.id);
      return { newVote: vote };
    }
  }

  // No existing vote — insert
  const { error } = await supabase
    .from('park_likes')
    .insert({ park_id: parkId, user_id: userId, vote });

  if (error) return { newVote: null, error: error.message };
  return { newVote: vote };
}
