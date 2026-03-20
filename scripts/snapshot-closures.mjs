#!/usr/bin/env node
/**
 * Captures a daily snapshot of trail closure status for every park.
 * Appends to data/closure-history.json as a time-series log.
 *
 * Run via: node scripts/snapshot-closures.mjs
 * Schedule daily (e.g., 6 AM ET) to build historical closure trends.
 *
 * Output format (closure-history.json):
 * [
 *   { "date": "2026-03-20", "statuses": { "blue-hills": "closed", "vietnam": "open", ... } },
 *   ...
 * ]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARKS_PATH = join(__dirname, '..', 'src', 'data', 'parks.ts');
const HISTORY_PATH = join(__dirname, '..', 'data', 'closure-history.json');

// Supabase client (service role for writes) — optional
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ── Minimal status logic (mirrors src/lib/status.ts) ──

function isInDateRange(month, day, start, end) {
  if (start.month > end.month) {
    return month >= start.month || month < end.month ||
      (month === end.month && day <= end.day);
  }
  return (
    (month > start.month || (month === start.month && day >= start.day)) &&
    (month < end.month || (month === end.month && day <= end.day))
  );
}

function getMudSeason(region) {
  if (region === 'Cape & Islands') return null;
  if (region.includes('Maine')) return { start: { month: 3, day: 1 }, end: { month: 5, day: 15 } };
  if (region === 'Southern VT') return { start: { month: 3, day: 15 }, end: { month: 5, day: 15 } };
  return { start: { month: 3, day: 1 }, end: { month: 4, day: 15 } };
}

function getStatus(park) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Check additional closures
  if (park.additionalClosures) {
    for (const closure of park.additionalClosures) {
      if (isInDateRange(month, day, closure.start, closure.end)) {
        return closure.type === 'formal' ? 'closed' : 'caution';
      }
    }
  }

  // Check primary closure
  if (park.closureStart && park.closureEnd) {
    if (isInDateRange(month, day, park.closureStart, park.closureEnd)) {
      return park.closureType === 'formal' ? 'closed' : 'caution';
    }
  }

  // Mud season advisory
  if (park.closureType === 'advisory') {
    const mud = getMudSeason(park.region);
    if (mud && isInDateRange(month, day, mud.start, mud.end)) {
      return 'caution';
    }
  }

  return 'open';
}

// ── Parse park data from TypeScript source ──

function parseParks() {
  const src = readFileSync(PARKS_PATH, 'utf-8');
  const parks = [];

  // Extract each park object using regex for key fields
  const parkBlocks = src.split(/\n  \{/).slice(1); // split by top-level object starts
  for (const block of parkBlocks) {
    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*["']([^"']+)["']`));
      return m ? m[1] : null;
    };
    const getNum = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*(\\d+)`));
      return m ? parseInt(m[1]) : null;
    };

    const id = get('id');
    if (!id) continue;

    const closureStart = (() => {
      const m = block.match(/closureStart:\s*\{\s*month:\s*(\d+),\s*day:\s*(\d+)/);
      return m ? { month: parseInt(m[1]), day: parseInt(m[2]) } : null;
    })();
    const closureEnd = (() => {
      const m = block.match(/closureEnd:\s*\{\s*month:\s*(\d+),\s*day:\s*(\d+)/);
      return m ? { month: parseInt(m[1]), day: parseInt(m[2]) } : null;
    })();

    // Parse additionalClosures
    const additionalClosures = [];
    const addMatch = block.match(/additionalClosures:\s*\[([\s\S]*?)\]/);
    if (addMatch) {
      const closureItems = addMatch[1].split(/\}\s*,\s*\{/);
      for (const item of closureItems) {
        const type = item.match(/type:\s*["'](\w+)["']/)?.[1];
        const startM = item.match(/start:\s*\{\s*month:\s*(\d+),\s*day:\s*(\d+)/);
        const endM = item.match(/end:\s*\{\s*month:\s*(\d+),\s*day:\s*(\d+)/);
        if (type && startM && endM) {
          additionalClosures.push({
            type,
            start: { month: parseInt(startM[1]), day: parseInt(startM[2]) },
            end: { month: parseInt(endM[1]), day: parseInt(endM[2]) },
          });
        }
      }
    }

    parks.push({
      id,
      region: get('region'),
      closureType: get('closureType'),
      closureStart,
      closureEnd,
      additionalClosures: additionalClosures.length > 0 ? additionalClosures : undefined,
    });
  }

  return parks;
}

// ── Main ──

const today = new Date().toISOString().split('T')[0];
const parks = parseParks();

console.log(`Snapshotting ${parks.length} parks for ${today}...`);

const statuses = {};
for (const park of parks) {
  statuses[park.id] = getStatus(park);
}

const counts = { open: 0, caution: 0, closed: 0 };
for (const s of Object.values(statuses)) counts[s]++;
console.log(`  Open: ${counts.open}, Caution: ${counts.caution}, Closed: ${counts.closed}`);

// Load existing history or create new
let history = [];
if (existsSync(HISTORY_PATH)) {
  try {
    history = JSON.parse(readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    history = [];
  }
}

// Replace today's entry if it already exists, otherwise append
const existingIdx = history.findIndex((e) => e.date === today);
const entry = { date: today, statuses };
if (existingIdx >= 0) {
  history[existingIdx] = entry;
  console.log(`  Updated existing entry for ${today}`);
} else {
  history.push(entry);
  console.log(`  Added new entry for ${today} (${history.length} total snapshots)`);
}

writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n');
console.log(`Saved to ${HISTORY_PATH}`);

// Upsert to Supabase if configured
if (supabase) {
  console.log('Upserting to Supabase...');
  const { error } = await supabase
    .from('closure_snapshots')
    .upsert(
      { snapshot_date: today, statuses },
      { onConflict: 'snapshot_date' }
    );

  if (error) {
    console.error('  Supabase upsert error:', error.message);
  } else {
    console.log('  Supabase: upserted snapshot for', today);
  }
} else {
  console.log('Supabase not configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable)');
}
