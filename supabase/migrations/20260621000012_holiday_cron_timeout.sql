-- ============================================================================
-- Migration: 20260621000012_holiday_cron_timeout
-- Phase:     5 — Priority 4 (Holiday cron repair): P4.2
-- Source of truth: PHASE5_IMPLEMENTATION.md §P4.2
-- ----------------------------------------------------------------------------
-- WHAT:  Raise the daily_holiday_update cron's HTTP timeout from 1000ms to
--        10000ms, keeping the same schedule (0 0 * * *).
--
-- WHY:   timeout_milliseconds:=1000 returns before the Edge Function finishes
--        its DB upsert + broadcast, so the cron logged "success" while the work
--        never completed (the misleading 246 "succeeded" runs). 10s lets it
--        finish. (The actual upsert bug is fixed by ...0007 adding updated_at.)
--
-- SAFETY: Re-points the existing job command via cron.alter_job; schedule
--         unchanged. Reversible (alter back to 1000ms). jobid 1 = daily_holiday_update.
-- ============================================================================

begin;

select cron.alter_job(
  job_id  => 1,
  command => $cmd$
    select net.http_post(
      url:='https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/update_holiday_theme',
      headers:=jsonb_build_object(),
      timeout_milliseconds:=10000
    );
  $cmd$
);

commit;
