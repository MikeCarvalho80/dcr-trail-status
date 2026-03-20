import { supabase } from './supabase';
import { ensureAnonAuth } from './anonAuth';
import type { TrailStatus } from '../data/parks';

export interface ConditionReport {
  id: string;
  park_id: string;
  status: TrailStatus;
  note: string;
  reporter_id?: string;
  created_at: string;
}

export interface AggregatedReports {
  total: number;
  recent: ConditionReport[];
  consensus: TrailStatus | null;
  lastReportedAt: string | null;
}

export interface SubmitResult {
  ok: boolean;
  rateLimited?: boolean;
  error?: string;
}

const REPORT_TTL_HOURS = 48;

function isRecent(dateStr: string): boolean {
  const age = Date.now() - new Date(dateStr).getTime();
  return age < REPORT_TTL_HOURS * 60 * 60 * 1000;
}

export async function submitReport(parkId: string, status: TrailStatus, note: string): Promise<SubmitResult> {
  if (!supabase) return { ok: false, error: 'Not configured' };

  // Ensure anonymous auth before inserting
  const userId = await ensureAnonAuth();
  if (!userId) return { ok: false, error: 'Authentication failed' };

  const { error } = await supabase
    .from('condition_reports')
    .insert({ park_id: parkId, status, note, reporter_id: userId });

  if (error) {
    // RLS policy rejection = rate limited
    if (error.code === '42501' || error.message.includes('policy')) {
      return { ok: false, rateLimited: true, error: 'Please wait ~4 hours before reporting again for this park.' };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getReports(parkId: string): Promise<AggregatedReports> {
  const empty: AggregatedReports = { total: 0, recent: [], consensus: null, lastReportedAt: null };
  if (!supabase) return empty;

  const cutoff = new Date(Date.now() - REPORT_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('condition_reports')
    .select('*')
    .eq('park_id', parkId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) return empty;

  const recent = data.filter((r) => isRecent(r.created_at));
  const statusCounts: Record<string, number> = {};
  for (const r of recent) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const consensus = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as TrailStatus | undefined;

  return {
    total: recent.length,
    recent: recent.slice(0, 5),
    consensus: consensus ?? null,
    lastReportedAt: recent[0]?.created_at ?? null,
  };
}

export async function getReportCounts(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!supabase) return map;

  const cutoff = new Date(Date.now() - REPORT_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('condition_reports')
    .select('park_id')
    .gte('created_at', cutoff);

  if (error || !data) return map;

  for (const row of data) {
    map.set(row.park_id, (map.get(row.park_id) || 0) + 1);
  }

  return map;
}
