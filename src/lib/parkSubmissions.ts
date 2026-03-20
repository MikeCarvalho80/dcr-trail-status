import { supabase, isSupabaseConfigured } from './supabase';
import { ensureAnonAuth } from './anonAuth';

export interface ParkSubmission {
  id: string;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string;
  reviewed_at: string | null;
  park_name: string;
  region: string;
  state: string;
  manager: string;
  url: string;
  lat: number;
  lng: number;
  parking: string;
  closure_type: string;
  closure_rule: string;
  closure_start: { month: number; day: number } | null;
  closure_end: { month: number; day: number } | null;
  additional_closures: unknown[] | null;
  notes: string;
  difficulty: string;
  miles: string;
  nemba: string;
  source: string;
  created_at: string;
}

interface SubmitData {
  park_name: string;
  region: string;
  state: string;
  manager: string;
  url: string;
  lat: number;
  lng: number;
  parking: string;
  closure_type: string;
  closure_rule: string;
  closure_start: { month: number; day: number } | null;
  closure_end: { month: number; day: number } | null;
  additional_closures: unknown[] | null;
  notes: string;
  difficulty: string;
  miles: string;
  nemba: string;
  source: string;
}

/**
 * Submit a new park to the database for review.
 */
export async function submitParkToDb(data: SubmitData): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: 'Supabase not configured' };

  const userId = await ensureAnonAuth();
  if (!userId) return { ok: false, error: 'Authentication failed' };

  const { error } = await supabase
    .from('park_submissions')
    .insert({
      submitted_by: userId,
      ...data,
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Get submissions by the current user.
 */
export async function getMySubmissions(): Promise<ParkSubmission[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const userId = await ensureAnonAuth();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('park_submissions')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as ParkSubmission[];
}

/**
 * Get all pending submissions (admin).
 */
export async function getPendingSubmissions(): Promise<ParkSubmission[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('park_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as ParkSubmission[];
}

/**
 * Approve a submission (admin).
 */
export async function approveSubmission(id: string, notes = ''): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from('park_submissions')
    .update({
      status: 'approved',
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  return !error;
}

/**
 * Reject a submission (admin).
 */
export async function rejectSubmission(id: string, notes = ''): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from('park_submissions')
    .update({
      status: 'rejected',
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  return !error;
}
