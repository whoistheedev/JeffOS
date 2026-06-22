-- ============================================================================
-- Migration: 20260621000006_rankings_sargable_typefix
-- Phase:     5 — Priority 3 (Leaderboard): P3.2 + folds in P1 search_path
-- Source of truth: PHASE5_IMPLEMENTATION.md §P3.2
-- ----------------------------------------------------------------------------
-- WHAT:  Rewrite the 4 ranking functions to:
--          1. return anon_id as TEXT (matches game_scores.anon_id, which is
--             text — the current `uuid` return type ERRORS on real data);
--          2. make the "today" queries SARGABLE (half-open created_at range
--             instead of created_at::date = d, so the (game_id, created_at)
--             index from ...0005 is usable);
--          3. pin search_path = public (Priority 1 / SEC-5).
--
-- WHY:   Today these functions would fail on populated data (type mismatch) and
--        cannot use an index for the date-bounded variants (seq scan).
--
-- SAFETY: CREATE OR REPLACE — signatures (arg types) unchanged, so the
--         game-submit Edge Function's rpc() calls keep working. The only
--         observable change is the RETURNS column type (uuid -> text), which is
--         correct vs the actual column. STABLE + invoker preserved. Reversible
--         (companion .down.sql restores the prior definitions).
-- ============================================================================

begin;

-- The RETURNS column type changes (uuid -> text), which CREATE OR REPLACE cannot
-- do for set-returning functions, so drop the two table-returning funcs first.
-- Safe: only the server-side game-submit calls rank_*/get_rankings_*; recreated
-- in the same transaction with identical argument signatures.
drop function if exists public.get_rankings_all(text);
drop function if exists public.get_rankings_today(text, date);

-- all-time leaderboard: top score per player
create or replace function public.get_rankings_all(g_id text)
  returns table(anon_id text, score integer)
  language sql stable
  set search_path = public
as $function$
  select anon_id, max(score) as score
  from public.game_scores
  where game_id = g_id
  group by anon_id
  order by score desc
$function$;

-- today's leaderboard: top score per player on date d (sargable range)
create or replace function public.get_rankings_today(g_id text, d date)
  returns table(anon_id text, score integer)
  language sql stable
  set search_path = public
as $function$
  select anon_id, max(score) as score
  from public.game_scores
  where game_id = g_id
    and created_at >= d::timestamptz
    and created_at <  (d + 1)::timestamptz
  group by anon_id
  order by score desc
$function$;

-- all-time rank of a given score
create or replace function public.rank_alltime(gameid text, score_input integer)
  returns integer
  language sql stable
  set search_path = public
as $function$
  select count(*) + 1
  from public.game_scores
  where game_id = gameid and score > score_input
$function$;

-- today's rank of a given score (sargable range instead of created_at::date)
create or replace function public.rank_today(gameid text, score_input integer)
  returns integer
  language sql stable
  set search_path = public
as $function$
  select count(*) + 1
  from public.game_scores
  where game_id = gameid
    and created_at >= date_trunc('day', now())
    and created_at <  date_trunc('day', now()) + interval '1 day'
    and score > score_input
$function$;

commit;
