-- ============================================================================
-- Migration: 20260621000010_games_index
-- Phase:     5 — Priority 5 (Asset delivery): P5.1, S2
-- Source of truth: PHASE5_IMPLEMENTATION.md §P5.1
-- ----------------------------------------------------------------------------
-- WHAT:  Create the games_index manifest table + public read policy.
--
-- WHY:   The games app enumerates the bucket at runtime (up to 31 storage
--        list() calls/mount). A precomputed manifest = 1 read instead.
--
-- SCOPE NOTE (important): this migration ONLY creates the table + policy. It
--   does NOT populate it and does NOT drop the broad bucket-listing policies
--   (SEC-7). Dropping those before the manifest is populated AND the client is
--   switched to read it would break the games app (it still lists the bucket).
--   Population (via an Edge Function/job) and the listing-policy removal are a
--   tracked follow-up once the client reads games_index.
--
-- SAFETY: Additive empty table + SELECT policy. Nothing reads it yet, so zero
--         behavior change today. Reversible (drop table).
-- ============================================================================

begin;

create table if not exists public.games_index (
  game_id    text primary key,
  system     text not null,
  title      text not null,
  rom_path   text not null,
  thumb_path text,
  updated_at timestamptz not null default now()
);

alter table public.games_index enable row level security;
drop policy if exists "public read games_index" on public.games_index;
create policy "public read games_index"
  on public.games_index for select
  to anon, authenticated
  using (true);

commit;
