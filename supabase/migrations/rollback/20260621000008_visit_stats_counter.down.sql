-- ROLLBACK for 20260621000008_visit_stats_counter
begin;
alter publication supabase_realtime drop table public.visit_stats;
drop trigger if exists trg_bump_visit_stats on public.visits;
drop function if exists public.bump_visit_stats();
drop table if exists public.visit_stats;
commit;
