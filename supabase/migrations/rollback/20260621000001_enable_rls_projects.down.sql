-- ROLLBACK for 20260621000001_enable_rls_projects
-- ⚠️ NOT RECOMMENDED: reverting re-opens SEC-1 (anon read/write of all projects).
-- Provided only for emergency reversibility. Prefer fixing forward.
begin;
drop policy if exists "public read active projects" on public.projects;
alter table public.projects disable row level security;
commit;
