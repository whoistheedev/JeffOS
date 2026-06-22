-- Rollback for 20260622000002_game_session_integrity
-- Reverting re-opens the C4 (replayable tokens) / H1 (unbounded growth) gaps.
begin;

drop function if exists public.cleanup_game_sessions();
drop index if exists public.game_sessions_expires_at_idx;
drop index if exists public.game_sessions_anon_id_idx;
alter table public.game_sessions drop column if exists expires_at;
alter table public.game_sessions drop column if exists used;

commit;
