#!/usr/bin/env node
/**
 * Scrapes trail condition data from public sources and writes to src/data/conditions.json.
 * Also checks park source URLs for health (404s) and writes to src/data/health.json.
 * Run via: node scripts/scrape-conditions.mjs
 */

import { load } from 'cheerio';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONDITIONS_PATH = join(__dirname, '..', 'src', 'data', 'conditions.json');
const HEALTH_PATH = join(__dirname, '..', 'src', 'data', 'health.json');
const PARKS_PATH = join(__dirname, '..', 'src', 'data', 'parks.ts');

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MTBTrailStatus/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MTBTrailStatus/1.0)' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    return res.status;
  } catch {
    return 0; // network error
  }
}

// ─────────────────────────────────────────────
// Source 1: mass.gov DCR park alerts
// ─────────────────────────────────────────────

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
  const match = html.match(/prefetch_alerts\("\/alerts\/page\/(\d+)"\)/);
  return match ? match[1] : null;
}

async function scrapeAlerts(pageId, parkId, source) {
  const html = await fetchText(`https://www.mass.gov/alerts/page/${pageId}`);
  if (!html || html.trim().length < 10) return [];

  const $ = load(html);
  const reports = [];

  $('.ma__header-alerts__container > li').each((_, el) => {
    const title = $(el).find('.ma__action-step__title-text').text().trim();
    const dateStr = $(el).find('.ma__action-step__title-suffix').text().trim();
    const body = $(el).find('.ma__action-step__content .ma__rich-text').text().trim();
    const severity = $(el).find('.ma__action-step__icon .ma__visually-hidden').text().trim() || 'notice';

    if (title) {
      const dateMatch = dateStr.match(/Updated\s+(.+)/i);
      const date = dateMatch ? dateMatch[1].trim() : dateStr;
      reports.push({
        parkId,
        source: source || 'mass.gov',
        title,
        body: body.slice(0, 500),
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
      if (!pageId) { console.log(`  ${parkId}: no alert page ID`); continue; }
      const reports = await scrapeAlerts(pageId, parkId, 'mass.gov');
      console.log(`  ${parkId}: ${reports.length || 'no'} alert(s)`);
      allReports.push(...reports);
    } catch (err) { console.error(`  ${parkId}: error — ${err.message}`); }
    await new Promise((r) => setTimeout(r, 500));
  }
  return allReports;
}

// ─────────────────────────────────────────────
// Source 2: NH State Parks alerts
// ─────────────────────────────────────────────

const NH_PARKS = [
  { parkId: 'bear-brook', url: 'https://www.nhstateparks.org/find-parks-trails/bear-brook-state-park' },
  { parkId: 'pawtuckaway', url: 'https://www.nhstateparks.org/find-parks-trails/pawtuckaway-state-park' },
  { parkId: 'ahern', url: 'https://www.nhstateparks.org/find-parks-trails/ahern-state-park' },
  { parkId: 'pisgah', url: 'https://www.nhstateparks.org/find-parks-trails/pisgah-state-park' },
];

async function scrapeNH() {
  console.log(`Scraping NH State Parks for ${NH_PARKS.length} parks...`);
  const allReports = [];
  for (const { parkId, url } of NH_PARKS) {
    try {
      const html = await fetchText(url);
      if (!html) { console.log(`  ${parkId}: fetch failed`); continue; }
      const $ = load(html);
      // NH State Parks puts alerts in .alert or .park-alert sections
      const alerts = [];
      $('.alert, .park-alert, .field--name-field-park-alerts').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10) {
          alerts.push({
            parkId,
            source: 'nhstateparks.org',
            title: text.slice(0, 100),
            body: text.slice(0, 500),
            date: '',
            severity: 'notice',
            scrapedAt: new Date().toISOString(),
          });
        }
      });
      console.log(`  ${parkId}: ${alerts.length || 'no'} alert(s)`);
      allReports.push(...alerts);
    } catch (err) { console.error(`  ${parkId}: error — ${err.message}`); }
    await new Promise((r) => setTimeout(r, 500));
  }
  return allReports;
}

// ─────────────────────────────────────────────
// Source 3: NY State Parks alerts
// ─────────────────────────────────────────────

const NY_PARKS = [
  { parkId: 'harriman', url: 'https://parks.ny.gov/visit/state-parks/harriman-state-park' },
  { parkId: 'sterling-forest', url: 'https://parks.ny.gov/parks/74/' },
  { parkId: 'grafton-lakes', url: 'https://parks.ny.gov/parks/53/' },
];

async function scrapeNY() {
  console.log(`Scraping NY State Parks for ${NY_PARKS.length} parks...`);
  const allReports = [];
  for (const { parkId, url } of NY_PARKS) {
    try {
      const html = await fetchText(url);
      if (!html) { console.log(`  ${parkId}: fetch failed`); continue; }
      const $ = load(html);
      const alerts = [];
      // NY State Parks puts alerts in .alert-banner or .park-alert-message
      $('.alert-banner, .park-alert-message, .alert-box, [class*="alert"]').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10 && !text.includes('JavaScript')) {
          alerts.push({
            parkId,
            source: 'parks.ny.gov',
            title: text.slice(0, 100),
            body: text.slice(0, 500),
            date: '',
            severity: 'notice',
            scrapedAt: new Date().toISOString(),
          });
        }
      });
      console.log(`  ${parkId}: ${alerts.length || 'no'} alert(s)`);
      allReports.push(...alerts);
    } catch (err) { console.error(`  ${parkId}: error — ${err.message}`); }
    await new Promise((r) => setTimeout(r, 500));
  }
  return allReports;
}

// ─────────────────────────────────────────────
// URL Health Check
// ─────────────────────────────────────────────

async function checkUrlHealth() {
  // Extract park URLs from parks.ts
  const parksTs = readFileSync(PARKS_PATH, 'utf8');
  const urlMatches = [...parksTs.matchAll(/id:\s*"([^"]+)"[\s\S]*?url:\s*"([^"]+)"/g)];

  console.log(`\nChecking URL health for ${urlMatches.length} parks...`);
  const health = {};
  let broken = 0;

  for (const [, parkId, url] of urlMatches) {
    const status = await fetchStatus(url);
    if (status === 0 || status >= 400) {
      console.log(`  ${parkId}: ${url} → ${status || 'UNREACHABLE'}`);
      health[parkId] = { url, status, checkedAt: new Date().toISOString() };
      broken++;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`  ${broken} broken URL(s) of ${urlMatches.length} checked`);
  writeFileSync(HEALTH_PATH, JSON.stringify(health, null, 2) + '\n');
  return health;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

const SOURCES = [
  { name: 'DCR (mass.gov)', fn: scrapeDCR },
  { name: 'NH State Parks', fn: scrapeNH },
  { name: 'NY State Parks', fn: scrapeNY },
];

async function main() {
  console.log('MTB Trail Status — Condition Scraper');
  console.log(`Running at ${new Date().toISOString()}\n`);

  const allReports = [];

  for (const { name, fn } of SOURCES) {
    console.log(`── ${name} ──`);
    try {
      const reports = await fn();
      allReports.push(...reports);
      console.log(`  Total: ${reports.length} reports\n`);
    } catch (err) {
      console.error(`  Source error: ${err.message}\n`);
    }
  }

  // Merge with existing (keep non-scraped sources)
  let existing = [];
  try { existing = JSON.parse(readFileSync(CONDITIONS_PATH, 'utf8')); } catch {}
  const scrapedSourceNames = new Set(['mass.gov', 'nhstateparks.org', 'parks.ny.gov']);
  const preserved = existing.filter((r) => !scrapedSourceNames.has(r.source));
  const output = [...allReports, ...preserved];
  writeFileSync(CONDITIONS_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${output.length} conditions to conditions.json`);

  // URL health check
  await checkUrlHealth();
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
