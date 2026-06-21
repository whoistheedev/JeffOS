-- ============================================================================
-- Migration: 20260621000004_function_search_path
-- Phase:     5 — Priority 1 (Security): SEC-5 function_search_path_mutable
-- Source of truth: PHASE5_IMPLEMENTATION.md §P1.1
-- ----------------------------------------------------------------------------
-- WHAT:  Pin search_path = public on update_updated_at_column().
--        (The 4 ranking functions get search_path set inline when their bodies
--         are rewritten in migration ...0005; doing it there avoids editing
--         them twice and keeps each migration self-consistent.)
--
-- WHY:   Advisor `function_search_path_mutable` flags functions without a fixed
--        search_path. Low risk here (all SECURITY INVOKER) but required for a
--        clean security advisor and best practice.
--
-- SAFETY: Metadata-only change to the function; no behavior change. Reversible.
-- ============================================================================

begin;

alter function public.update_updated_at_column() set search_path = public;

commit;
