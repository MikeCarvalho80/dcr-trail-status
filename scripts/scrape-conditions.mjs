#!/usr/bin/env node
/**
 * Scrapes trail condition data from public sources and writes to src/data/conditions.json.
 * Run via: node scripts/scrape-conditions.mjs
 *
 * Sources:
 * 1. mass.gov DCR park alerts — HTML fragments at /alerts/page/{ID}
 *
 * Architecture: Each source module exports an async function that returns
 * an array of ConditionReport objects. New sources are added by writing
 * a new scraper function and adding it to the SOURCES array.
 */

import { load } from 'cheerio';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', 'conditions.json');

// ─────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────

/**
 * @typedef {{ parkId: string, source: string, title: string, body: string, date: string, severity: string, scrapedAt: string }} ConditionReport
 */

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MTBTrailStatus/1.0)' },
  });
  if (!res.ok) return null;
  return res.text();
}

// ─────────────────────────────────────────────
// Source: mass.gov DCR alerts
// ─────────────────────────────────────────────

// Map park IDs in our app → mass.gov location slugs
// We'll discover the alert page IDs dynamically from each location page
const DCR_PARKS = [
  { parkId: 'blue-hills', slug: 'blue-hills-reservation' },
  { parkId: 'fells', slug: 'middlesex-fells-reservation' },
  { parkId: 'great-brook', slug: 'great-brook-farm-state-park' },
  { parkId: 'wompatuck', slug: 'wompatuck-state-park' },
  { parkId: 'stony-brook', slug: 'stony-brook-reservation' },
  { parkId: 'neponset', slug: 'neponset-river-reservation' },
  { parkId: 'harold-parker', slug: 'harold-parker-state-forest' },
  { parkId: 'borderland', slug: 'borderland-state-park' },
  { parkId: 'myles-standish', slug: 'myles-standish-state-forest' },
  { parkId: 'nickerson', slug: 'nickerson-state-park' },
  { parkId: 'upton', slug: 'upton-state-forest' },
  { parkId: 'leominster', slug: 'leominster-state-forest' },
  { parkId: 'douglas', slug: 'douglas-state-forest' },
  { parkId: 'f-gilbert-hills', slug: 'f-gilbert-hills-state-forest' },
  { parkId: 'massasoit', slug: 'massasoit-state-park' },
  { parkId: 'callahan', slug: 'callahan-state-park' },
  { parkId: 'october-mountain', slug: 'october-mountain-state-forest' },
  { parkId: 'brimfield', slug: 'brimfield-state-forest' },
  { parkId: 'freetown-fall-river', slug: 'freetown-fall-river-state-forest' },
  { parkId: 'pittsfield-sf', slug: 'pittsfield-state-forest' },
  { parkId: 'lowell-dracut-tyngsboro', slug: 'lowell-dracut-tyngsboro-state-forest' },
  { parkId: 'willowdale', slug: 'willowdale-state-forest' },
  { parkId: 'georgetown-rowley', slug: 'georgetown-rowley-state-forest' },
  { parkId: 'bradley-palmer', slug: 'bradley-palmer-state-park' },
  { parkId: 'correllus', slug: 'manuel-f-correllus-state-forest' },
];

async function getAlertPageId(slug) {
  const html = await fetchText(`https://www.mass.gov/locations/${slug}`);
  if (!html) return null;
  // Look for prefetch_alerts("/alerts/page/{ID}")
  const match = html.match(/prefetch_alerts\("\/alerts\/page\/(\d+)"\)/);
  return match ? match[1] : null;
}

async function scrapeAlerts(pageId, parkId) {
  const html = await fetchText(`https://www.mass.gov/alerts/page/${pageId}`);
  if (!html || html.trim().length < 10) return []; // No alerts

  const $ = load(html);
  const reports = [];

  $('.ma__header-alerts__container > li').each((_, el) => {
    const title = $(el).find('.ma__action-step__title-text').text().trim();
    const dateStr = $(el).find('.ma__action-step__title-suffix').text().trim();
    const body = $(el).find('.ma__action-step__content .ma__rich-text').text().trim();
    const severity = $(el).find('.ma__action-step__icon .ma__visually-hidden').text().trim() || 'notice';

    if (title) {
      // Parse date like "Updated Jun. 3, 2025, 10:18 am"
      const dateMatch = dateStr.match(/Updated\s+(.+)/i);
      const date = dateMatch ? dateMatch[1].trim() : dateStr;

      reports.push({
        parkId,
        source: 'mass.gov',
        title,
        body: body.slice(0, 500), // Truncate long descriptions
        date,
        severity,
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return reports;
}

async function scrapeDCR() {
  console.log(`Scraping DCR alerts for ${DCR_PARKS.length} parks...`);
  const allReports = [];

  for (const { parkId, slug } of DCR_PARKS) {
    try {
      const pageId = await getAlertPageId(slug);
      if (!pageId) {
        console.log(`  ${parkId}: no alert page ID found`);
        continue;
      }
      const reports = await scrapeAlerts(pageId, parkId);
      if (reports.length > 0) {
        console.log(`  ${parkId}: ${reports.length} alert(s)`);
        allReports.push(...reports);
      } else {
        console.log(`  ${parkId}: no alerts`);
      }
    } catch (err) {
      console.error(`  ${parkId}: error — ${err.message}`);
    }
    // Rate limit: 500ms between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  return allReports;
}

// ─────────────────────────────────────────────
// Source: NH State Parks (placeholder for future)
// ─────────────────────────────────────────────

// async function scrapeNHStateParks() { ... }

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

const SOURCES = [
  { name: 'DCR (mass.gov)', fn: scrapeDCR },
];

async function main() {
  console.log('MTB Trail Status — Condition Scraper');
  console.log(`Running at ${new Date().toISOString()}`);
  console.log('');

  const allReports = [];

  for (const { name, fn } of SOURCES) {
    console.log(`\n── ${name} ──`);
    try {
      const reports = await fn();
      allReports.push(...reports);
      console.log(`  Total: ${reports.length} reports`);
    } catch (err) {
      console.error(`  Source error: ${err.message}`);
    }
  }

  // Load existing conditions and merge (keep non-expired entries from other sources)
  let existing = [];
  try {
    existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  } catch {
    // First run, no existing file
  }

  // Keep conditions from sources we didn't scrape this run (future-proofing)
  const scrapedSources = new Set(SOURCES.map((s) => s.name));
  const preserved = existing.filter(
    (r) => !scrapedSources.has(r.source === 'mass.gov' ? 'DCR (mass.gov)' : r.source)
  );

  const output = [...allReports, ...preserved];

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`\nWrote ${output.length} conditions to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
