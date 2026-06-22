-- ============================================================================
-- Migration: 20260621000001_enable_rls_projects
-- Phase:     4.5 Security Hotfix — SEC-1 (🔴 Critical)
-- Source of truth: PHASE_4_5_SECURITY_HOTFIX.md §2 (step 1)
-- ----------------------------------------------------------------------------
-- WHAT:  Enable Row Level Security on public.projects (currently DISABLED) and
--        add a recruiter-safe public read policy for active projects only.
--
-- WHY:   With RLS disabled, the anon publishable key (shipped in the client
--        bundle) can read AND write/delete every row in public.projects.
--        Advisor `rls_disabled_in_public` flags this as ERROR.
--
-- SAFETY:
--   - The recruiter app (src/apps/recruiter/Recruiter.tsx) runs exactly:
--       select * from projects where active = true order by id
--     The SELECT policy below preserves precisely that read and nothing more.
--   - No INSERT/UPDATE/DELETE policy is created => anon writes are denied.
--     Manage rows via the dashboard or a service-role path.
--   - Small + reversible. Rollback is in the companion .down.sql (DO NOT auto-run;
--     reverting re-opens the vulnerability).
--
-- APPLY: Manually, after review. NOT applied automatically. See README.md.
-- ============================================================================

begin;

alter table public.projects enable row level security;

drop policy if exists "public read active projects" on public.projects;
create policy "public read active projects"
  on public.projects
  for select
  to anon, authenticated
  using (active is true);

commit;
