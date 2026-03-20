import conditionsData from '../data/conditions.json';

export interface ConditionReport {
  parkId: string;
  source: string;
  title: string;
  body: string;
  date: string;
  severity: string;
  scrapedAt: string;
}

const conditions = conditionsData as ConditionReport[];

/**
 * Get active condition reports for a specific park.
 * Returns reports from the last 7 days, newest first.
 */
export function getParkConditions(parkId: string): ConditionReport[] {
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
