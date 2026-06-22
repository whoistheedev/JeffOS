-- Rollback for 20260622000004_most_played_rpc
begin;
drop function if exists public.get_most_played(integer);
commit;
