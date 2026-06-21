-- ============================================================================
-- Migration: 20260621000007_defaults_updated_at
-- Phase:     5 — Priority 4 (Holiday cron repair): P4.1 Option A
-- Source of truth: PHASE5_IMPLEMENTATION.md §P4.1
-- ----------------------------------------------------------------------------
-- WHAT:  Add updated_at to public.defaults.
--
-- WHY:   The update_holiday_theme Edge Function upserts
--          defaults.upsert({ key, value, updated_at })
--        but the column does not exist -> the upsert throws, the holiday theme
--        is never persisted, and the broadcast (after the upsert) never fires.
--        Adding the column makes the existing function work unchanged.
--        (Pairs cleanly with the themes_manifest row in migration ...0011.)
--
-- SAFETY: Additive nullable-with-default column. Existing reads
--         (select value where key = ...) are unaffected. Reversible (drop column).
-- ============================================================================

begin;

alter table public.defaults
  add column if not exists updated_at timestamptz not null default now();

commit;
