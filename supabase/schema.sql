-- TrailClear — Supabase Schema (migration-safe)
-- Safe to run on both fresh projects and existing ones with condition_reports.
-- Run this in your Supabase SQL Editor.

-- ═══════════════════════════════════════════════
-- 1. Migrate existing condition_reports table
-- ═══════════════════════════════════════════════

-- Add reporter_id column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'condition_reports' and column_name = 'reporter_id'
  ) then
    alter table condition_reports add column reporter_id uuid references auth.users(id);
  end if;
end $$;

-- Add rate-limit index (idempotent)
create index if not exists idx_reports_rate_limit
  on condition_reports (reporter_id, park_id, created_at desc);

-- Swap permissive insert policy for rate-limited one
drop policy if exists "Anyone can insert reports" on condition_reports;
drop policy if exists "Rate-limited inserts" on condition_reports;

create policy "Rate-limited inserts"
  on condition_reports for insert
  with check (
    auth.uid() is not null
    and not exists (
      select 1 from condition_reports cr
      where cr.reporter_id = auth.uid()
        and cr.park_id = park_id
        and cr.created_at > now() - interval '4 hours'
    )
  );

-- Ensure read policy exists
drop policy if exists "Anyone can read reports" on condition_reports;
create policy "Anyone can read reports"
  on condition_reports for select
  using (true);

-- ═══════════════════════════════════════════════
-- 2. User Preferences (Cross-Device Sync)
-- ═══════════════════════════════════════════════

create table if not exists user_prefs (
  id uuid primary key,  -- matches auth.uid()
  favorites text[] default '{}',
  visited text[] default '{}',
  updated_at timestamptz default now()
);

alter table user_prefs enable row level security;

drop policy if exists "Users can read own prefs" on user_prefs;
create policy "Users can read own prefs"
  on user_prefs for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own prefs" on user_prefs;
create policy "Users can insert own prefs"
  on user_prefs for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own prefs" on user_prefs;
create policy "Users can update own prefs"
  on user_prefs for update
  using (auth.uid() = id);

-- ═══════════════════════════════════════════════
-- 3. Scraped Conditions (from scripts)
-- ═══════════════════════════════════════════════

create table if not exists scraped_conditions (
  id uuid default gen_random_uuid() primary key,
  park_id text not null,
  source text not null,
  title text not null,
  body text default '',
  alert_date text default '',
  severity text default 'notice',
  scraped_at timestamptz default now()
);

create index if not exists idx_scraped_park
  on scraped_conditions (park_id, scraped_at desc);

alter table scraped_conditions enable row level security;

drop policy if exists "Anyone can read scraped conditions" on scraped_conditions;
create policy "Anyone can read scraped conditions"
  on scraped_conditions for select
  using (true);

-- Inserts via service role key (bypasses RLS)

-- ═══════════════════════════════════════════════
-- 4. Closure History Snapshots
-- ═══════════════════════════════════════════════

create table if not exists closure_snapshots (
  id uuid default gen_random_uuid() primary key,
  snapshot_date date not null unique,
  statuses jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_snapshots_date
  on closure_snapshots (snapshot_date desc);

alter table closure_snapshots enable row level security;

drop policy if exists "Anyone can read closure snapshots" on closure_snapshots;
create policy "Anyone can read closure snapshots"
  on closure_snapshots for select
  using (true);

-- Inserts via service role key (bypasses RLS)

-- ═══════════════════════════════════════════════
-- 5. Park Submissions Pipeline
-- ═══════════════════════════════════════════════

create table if not exists park_submissions (
  id uuid default gen_random_uuid() primary key,
  submitted_by uuid references auth.users(id),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_notes text default '',
  reviewed_at timestamptz,
  park_name text not null,
  region text not null,
  state text not null,
  manager text not null,
  url text not null,
  lat numeric not null,
  lng numeric not null,
  parking text not null,
  closure_type text not null,
  closure_rule text not null,
  closure_start jsonb,
  closure_end jsonb,
  additional_closures jsonb,
  notes text default '',
  difficulty text not null,
  miles text not null,
  nemba text default '',
  source text default '',
  created_at timestamptz default now()
);

alter table park_submissions enable row level security;

drop policy if exists "Authenticated users can submit parks" on park_submissions;
create policy "Authenticated users can submit parks"
  on park_submissions for insert
  with check (auth.uid() is not null);

drop policy if exists "Users can read own and approved submissions" on park_submissions;
create policy "Users can read own and approved submissions"
  on park_submissions for select
  using (auth.uid() = submitted_by or status = 'approved');

drop policy if exists "Admins can update submissions" on park_submissions;
create policy "Admins can update submissions"
  on park_submissions for update
  using (auth.uid() is not null);

-- ═══════════════════════════════════════════════
-- 6. Park Likes (thumbs up / thumbs down)
-- ═══════════════════════════════════════════════

create table if not exists park_likes (
  id uuid default gen_random_uuid() primary key,
  park_id text not null,
  user_id uuid references auth.users(id),
  vote smallint not null check (vote in (1, -1)),
  created_at timestamptz default now(),
  unique(park_id, user_id)
);

create index if not exists idx_park_likes_park on park_likes (park_id);
create index if not exists idx_park_likes_user on park_likes (user_id);

alter table park_likes enable row level security;

drop policy if exists "Anyone can read park likes" on park_likes;
create policy "Anyone can read park likes"
  on park_likes for select
  using (true);

drop policy if exists "Authenticated users can vote" on park_likes;
create policy "Authenticated users can vote"
  on park_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own votes" on park_likes;
create policy "Users can update own votes"
  on park_likes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own votes" on park_likes;
create policy "Users can delete own votes"
  on park_likes for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- 7. Realtime (requires paid plan)
-- ═══════════════════════════════════════════════
-- Realtime subscriptions on condition_reports require a paid Supabase plan.
-- The app detects this gracefully — if Realtime is unavailable, new reports
-- appear on the next manual refresh instead of live-streaming in.
-- To enable on a paid plan: Dashboard > Database > Replication > add condition_reports
-- Or run: alter publication supabase_realtime add table condition_reports;
