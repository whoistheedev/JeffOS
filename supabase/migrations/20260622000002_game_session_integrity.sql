-- ============================================================================
-- Migration: 20260622000002_game_session_integrity
-- Phase:     Game scoreboard P0 hardening
-- Source of truth: GAME_SCOREBOARD_SCALABILITY_AUDIT.md §3 (items 2, 6) + §4 P0/P1
-- ----------------------------------------------------------------------------
-- WHAT:  Make game_sessions single-use + expiring, index anon_id for
--        rate-limiting, and add a cleanup function for a cron to call.
--
-- WHY (audit findings):
--   C4 — tokens were infinitely replayable (no `used` flag) → one game-start
--        allowed unlimited game-submits. Add `used boolean`.
--   H1 — game_sessions grew unbounded (no TTL/cleanup). Add `expires_at` +
--        a cleanup function (cron wiring is a follow-up; safe to call anytime).
--   H3 — submit abuse needs per-anon lookups; `anon_id` was unindexed.
--
-- SAFETY: purely additive (new nullable columns w/ defaults, new index, new
--         function). Both game tables are EMPTY (0 rows) today, so no backfill
--         risk. Reversible (companion .down.sql). search_path pinned on the fn.
--
-- APPLY:  Manually, after review. See README.md.
-- ============================================================================

begin;

-- Single-use + expiry. Defaults are backward-compatible: existing/in-flight
-- sessions (there are none — table is empty) default to not-used and a 2h TTL.
alter table public.game_sessions
  add column if not exists used boolean not null default false;

alter table public.game_sessions
  add column if not exists expires_at timestamptz not null default (now() + interval '2 hours');

-- Per-anon lookups for rate-limiting (H3) + cheap cleanup scans by expiry.
create index if not exists game_sessions_anon_id_idx
  on public.game_sessions (anon_id);

create index if not exists game_sessions_expires_at_idx
  on public.game_sessions (expires_at);

-- Cleanup: delete used or expired sessions. A pg_cron job (or the existing
-- scheduled-task pattern) can call this; safe to run anytime, idempotent.
create or replace function public.cleanup_game_sessions()
  returns integer
  language plpgsql
  security definer
  set search_path = public
as $function$
declare
  deleted integer;
begin
  delete from public.game_sessions
  where used = true or expires_at < now();
  get diagnostics deleted = row_count;
  return deleted;
end;
$function$;

commit;
