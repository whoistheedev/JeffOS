-- ============================================================================
-- Migration: 20260621000003_drop_game_anon_insert
-- Phase:     4.5 Security Hotfix — SEC-3 (🟠 High)
-- Source of truth: PHASE_4_5_SECURITY_HOTFIX.md §2 (step 3)
-- ----------------------------------------------------------------------------
-- WHAT:  Remove the permissive anon direct-INSERT policies on public.game_scores
--        and public.game_sessions.
--
-- WHY:   The game-start -> game-submit flow issues a session token validated
--        server-side specifically to stop forged scores. The anon INSERT
--        policies (WITH CHECK true) let a client skip the flow entirely and
--        insert arbitrary scores/sessions. Advisor `rls_policy_always_true`.
--
-- SAFETY:
--   - "anon select scores" on game_scores is KEPT (no client reads it today;
--     revisited in Phase 5 SEC-4 if leaderboards move client-side).
--   - game-start / game-submit use the SERVICE ROLE (bypasses RLS) -> unaffected.
--   - Small + reversible (companion .down.sql; reverting re-opens cheating).
--
-- APPLY: Manually, after review. NOT applied automatically. See README.md.
-- ============================================================================

begin;

drop policy if exists "anon insert scores"   on public.game_scores;
drop policy if exists "anon insert sessions" on public.game_sessions;

commit;
