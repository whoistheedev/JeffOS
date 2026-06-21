-- ============================================================================
-- Migration: 20260621000008_visit_stats_counter
-- Phase:     5 — Priority 2 (Realtime correctness): P2.1, S1 + S6 + SEC-4
-- Source of truth: PHASE5_IMPLEMENTATION.md §P2.1
-- ----------------------------------------------------------------------------
-- WHAT:  Replace the per-client COUNT(*) visitor pattern with a single counter
--        row maintained by a trigger, and publish ONLY that 1-row table to
--        realtime.
--
-- WHY:   The supabase_realtime publication is empty -> postgres_changes never
--        fires (visitor count never live-updates). Naively publishing `visits`
--        with event:* would make every client re-run COUNT(*) on every insert
--        (O(N^2) storm). A counter row is O(1) per visit and safe to publish.
--
-- SAFETY:
--   - Additive: new table + trigger + policy + publication membership.
--   - Counter seeded from the live count at apply time.
--   - bump trigger is AFTER INSERT only (matches one-row-per-anon upsert-insert).
--   - RLS enabled with public SELECT on the 1-row counter (no row data leaks;
--     it's just a number). Reversible (companion .down.sql).
-- ============================================================================

begin;

create table if not exists public.visit_stats (
  id    int    primary key default 1,
  total bigint not null    default 0
);

-- seed from the current live visits count (accurate at apply time)
insert into public.visit_stats (id, total)
  values (1, (select count(*) from public.visits))
  on conflict (id) do update set total = excluded.total;

create or replace function public.bump_visit_stats()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $function$
begin
  update public.visit_stats set total = total + 1 where id = 1;
  return new;
end;
$function$;

drop trigger if exists trg_bump_visit_stats on public.visits;
create trigger trg_bump_visit_stats
  after insert on public.visits
  for each row execute function public.bump_visit_stats();

-- read access to the 1-row counter
alter table public.visit_stats enable row level security;
drop policy if exists "public read visit_stats" on public.visit_stats;
create policy "public read visit_stats"
  on public.visit_stats for select
  to anon, authenticated
  using (true);

-- publish ONLY the counter to realtime (NOT public.visits)
alter publication supabase_realtime add table public.visit_stats;
alter table public.visit_stats replica identity full;

commit;
