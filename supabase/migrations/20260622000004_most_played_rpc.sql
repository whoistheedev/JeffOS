-- ============================================================================
-- Migration: 20260622000004_most_played_rpc
-- Phase:     Game scoreboard — "most played" board (plays-only design)
-- Source of truth: GAME_SCOREBOARD_SCALABILITY_AUDIT.md (plays-only leaderboard)
-- ----------------------------------------------------------------------------
-- WHAT:  A read-only RPC returning play counts per game_id (top N), derived
--        from game_sessions (every game-start records one "play"). EmulatorJS
--        can't report scores, so the honest board is "most played", not high
--        scores.
--
-- WHY:   Lets the client render a leaderboard with ONE cheap call instead of a
--        client-side group-by.
--
-- SECURITY: SECURITY DEFINER on purpose — game_sessions has RLS enabled with no
--        anon SELECT policy (tokens must stay private), so a SECURITY INVOKER
--        function returns nothing for anon. This function bypasses RLS but
--        exposes ONLY aggregate counts (game_id + play count) — no tokens, no
--        anon_ids, no row data. anon EXECUTE is intentional (public read board).
--        (The advisor's "anon can execute SECURITY DEFINER" note is expected and
--        acceptable here: the function is a safe, read-only public aggregate.)
--
-- SAFETY: read-only; no data/behavior change. Reversible (.down.sql).
--         Uses game_sessions index; search_path pinned.
-- ============================================================================

begin;

create or replace function public.get_most_played(limit_n integer default 20)
  returns table(game_id text, plays bigint)
  language sql
  stable
  security definer
  set search_path = public
as $function$
  select game_id, count(*) as plays
  from public.game_sessions
  group by game_id
  order by plays desc, game_id
  limit greatest(1, least(coalesce(limit_n, 20), 100))
$function$;

commit;
