-- ROLLBACK for 20260621000010_games_index
begin;
drop policy if exists "public read games_index" on public.games_index;
drop table if exists public.games_index;
commit;
