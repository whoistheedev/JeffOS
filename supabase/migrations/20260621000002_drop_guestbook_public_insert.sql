-- ============================================================================
-- Migration: 20260621000002_drop_guestbook_public_insert
-- Phase:     4.5 Security Hotfix — SEC-2 (🟠 High)
-- Source of truth: PHASE_4_5_SECURITY_HOTFIX.md §2 (step 2)
-- ----------------------------------------------------------------------------
-- WHAT:  Remove the permissive public direct-INSERT policy on public.guestbook.
--
-- WHY:   The `guestbook-add` Edge Function exists to mask profanity, enforce a
--        2s anti-bot delay, and cap handle/message length. The "Public insert"
--        policy (WITH CHECK true, role public) lets ANY client insert directly
--        and skip all of that. Advisor `rls_policy_always_true` flags it.
--
-- SAFETY:
--   - "Public select" is KEPT, so the guestbook wall still renders.
--   - `guestbook-add` uses the SERVICE ROLE, which BYPASSES RLS, so it keeps
--     inserting normally. The client never inserts directly
--     (src/apps/guestbook/Guestbook.tsx posts via the Edge Function only).
--   - Small + reversible (companion .down.sql; reverting re-opens the bypass).
--
-- APPLY: Manually, after review. NOT applied automatically. See README.md.
-- ============================================================================

begin;

drop policy if exists "Public insert" on public.guestbook;

commit;
