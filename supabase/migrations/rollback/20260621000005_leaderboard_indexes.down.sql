-- ROLLBACK for 20260621000005_leaderboard_indexes
begin;
drop index if exists public.game_scores_game_score_idx;
drop index if exists public.game_scores_game_created_idx;
drop index if exists public.game_scores_session_id_idx;
drop index if exists public.guestbook_created_at_idx;
commit;
