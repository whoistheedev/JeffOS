-- ============================================================================
-- Migration: 20260622000003_lock_cleanup_game_sessions
-- Phase:     Game scoreboard P0 hardening (follow-up to ...0002)
-- ----------------------------------------------------------------------------
-- WHAT:  Revoke EXECUTE on public.cleanup_game_sessions() from anon +
--        authenticated (and PUBLIC). Only the service role / a cron should
--        purge sessions.
--
-- WHY:   The security advisor flagged that the SECURITY DEFINER cleanup
--        function was callable by anon via /rest/v1/rpc/cleanup_game_sessions
--        (lints 0028/0029) — a public could trigger deletes of session rows.
--        It's idempotent and only removes used/expired rows, but it should not
--        be a public API surface.
--
-- SAFETY: revoke-only; no data/behavior change for legitimate callers (service
--         role bypasses grants). Reversible (companion .down.sql re-grants).
-- ============================================================================

begin;

revoke all on function public.cleanup_game_sessions() from public;
revoke all on function public.cleanup_game_sessions() from anon;
revoke all on function public.cleanup_game_sessions() from authenticated;

commit;
