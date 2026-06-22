-- ============================================================================
-- Migration: 20260621000013_harden_bump_visit_stats
-- Phase:     5 — Priority 1 (Security) follow-up
-- ----------------------------------------------------------------------------
-- WHAT:  Revoke EXECUTE on public.bump_visit_stats() from anon/authenticated
--        (and PUBLIC).
--
-- WHY:   bump_visit_stats() is a SECURITY DEFINER *trigger* function added in
--        migration ...0008. PostgREST exposes any public function as an RPC, so
--        the advisor flagged it as anon/authenticated-callable
--        (anon_security_definer_function_executable). A trigger function must
--        never be called directly. Revoking EXECUTE removes the RPC surface;
--        the AFTER INSERT trigger still fires normally (triggers do not require
--        the calling role to hold EXECUTE).
--
-- SAFETY: Permission-only change. The visit counter trigger is unaffected.
--         Reversible (re-grant). Clears 2 security advisor WARNs.
-- ============================================================================

begin;

revoke execute on function public.bump_visit_stats() from public, anon, authenticated;

commit;
