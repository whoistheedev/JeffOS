-- ROLLBACK for 20260621000013_harden_bump_visit_stats
-- (re-exposes bump_visit_stats as a callable RPC; not recommended)
begin;
grant execute on function public.bump_visit_stats() to anon, authenticated;
commit;
