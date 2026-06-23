-- Rollback for 20260622000003_lock_cleanup_game_sessions
-- Re-grants EXECUTE (re-exposes the cleanup RPC to anon/authenticated — the
-- thing the advisor flagged). Only revert if intentionally re-opening it.
begin;
grant execute on function public.cleanup_game_sessions() to anon;
grant execute on function public.cleanup_game_sessions() to authenticated;
commit;
