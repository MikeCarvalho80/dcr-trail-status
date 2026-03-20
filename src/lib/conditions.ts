import conditionsData from '../data/conditions.json';
import { supabase, isSupabaseConfigured } from './supabase';

export interface ScrapedConditionReport {
  parkId: string;
  source: string;
  title: string;
  body: string;
  date: string;
  severity: string;
  scrapedAt: string;
}

const conditions = conditionsData as ScrapedConditionReport[];

/**
 * Get active condition reports for a specific park from bundled JSON.
 * Returns reports from the last 7 days, newest first.
 */
export function getParkConditions(parkId: string): ScrapedConditionReport[] {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return conditions
    .filter((c) => {
      if (c.parkId !== parkId) return false;
      const scraped = new Date(c.scrapedAt).getTime();
      return scraped > sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());
}

/**
 * Fetch live conditions from Supabase for a specific park.
 * Falls back to bundled JSON if Supabase is unavailable.
 */
export async function fetchLiveConditions(parkId: string): Promise<ScrapedConditionReport[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('scraped_conditions')
        .select('*')
        .eq('park_id', parkId)
        .gte('scraped_at', sevenDaysAgo)
        .order('scraped_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          parkId: row.park_id,
          source: row.source,
          title: row.title,
          body: row.body ?? '',
          date: row.alert_date ?? '',
          severity: row.severity ?? 'notice',
          scrapedAt: row.scraped_at,
        }));
      }
    } catch {
      // fall through to bundled
    }
  }

  // Fallback to bundled JSON
  return getParkConditions(parkId);
}

/**
 * Get the freshness timestamp of the most recent scrape.
 */
export function getLastScrapedAt(): string | null {
  if (conditions.length === 0) return null;
  const newest = conditions.reduce((latest, c) =>
    c.scrapedAt > latest ? c.scrapedAt : latest, conditions[0].scrapedAt
  );
  return newest;
}

/**
 * Check if any park has active condition reports.
 */
export function hasAnyConditions(): boolean {
  return conditions.length > 0;
}
