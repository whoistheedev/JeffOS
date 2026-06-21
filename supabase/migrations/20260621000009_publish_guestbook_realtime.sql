-- ============================================================================
-- Migration: 20260621000009_publish_guestbook_realtime
-- Phase:     5 — Priority 2 (Realtime correctness): P2.2, S1
-- Source of truth: PHASE5_IMPLEMENTATION.md §P2.2
-- ----------------------------------------------------------------------------
-- WHAT:  Add public.guestbook to the supabase_realtime publication.
--
-- WHY:   The guestbook client (src/apps/guestbook/Guestbook.tsx) already
--        subscribes to INSERT and appends the payload to its cache, but the
--        table isn't published so nothing fires. Guestbook is low-write and
--        payload-carrying (no COUNT re-query), so publishing it is safe.
--
-- SAFETY: Publication membership + replica identity only. No data/behavior
--         change server-side; the existing client subscription starts working.
--         Reversible (drop from publication).
-- ============================================================================

begin;

alter publication supabase_realtime add table public.guestbook;
alter table public.guestbook replica identity full;

commit;
