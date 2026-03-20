#!/usr/bin/env node
/**
 * Queries approved park submissions from Supabase and outputs
 * parks.ts-compatible entries to stdout.
 *
 * Usage: node scripts/pull-approved-parks.mjs
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatEntry(sub) {
  const id = generateId(sub.park_name);
  const today = new Date().toISOString().split('T')[0];

  const closureStart = sub.closure_start
    ? `{ month: ${sub.closure_start.month}, day: ${sub.closure_start.day} }`
    : 'null';
  const closureEnd = sub.closure_end
    ? `{ month: ${sub.closure_end.month}, day: ${sub.closure_end.day} }`
    : 'null';

  let addClosures = '';
  if (sub.additional_closures && sub.additional_closures.length > 0) {
    const items = sub.additional_closures.map((c) =>
      `      { label: "${c.label}", type: "${c.type}", start: { month: ${c.start.month}, day: ${c.start.day} }, end: { month: ${c.end.month}, day: ${c.end.day} }, rule: "${c.rule}" }`
    ).join(',\n');
    addClosures = `\n    additionalClosures: [\n${items},\n    ],`;
  }

  return `  {
    id: "${id}",
    name: "${sub.park_name}",
    region: "${sub.region}",
    state: "${sub.state}",
    manager: "${sub.manager}",
    url: "${sub.url}",
    lat: ${Number(sub.lat).toFixed(4)},
    lng: ${Number(sub.lng).toFixed(4)},
    parking: "${sub.parking}",
    closureType: "${sub.closure_type}",
    closureRule: "${sub.closure_rule}",
    closureStart: ${closureStart},
    closureEnd: ${closureEnd},${addClosures}
    notes: "${sub.notes}",
    difficulty: "${sub.difficulty}",
    miles: "${sub.miles}",
    nemba: "${sub.nemba}",${sub.source ? `\n    source: "${sub.source}",` : ''}
    lastVerified: "${today}",
  },`;
}

async function main() {
  const { data, error } = await supabase
    .from('park_submissions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('// No approved submissions found');
    return;
  }

  console.log(`// ${data.length} approved park submission(s)`);
  console.log('// Paste into src/data/parks.ts PARKS array\n');

  for (const sub of data) {
    console.log(formatEntry(sub));
    console.log('');
  }
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
