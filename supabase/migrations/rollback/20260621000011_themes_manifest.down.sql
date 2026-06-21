-- ROLLBACK for 20260621000011_themes_manifest
-- ⚠️ Client falls back to HEAD-probing themes again.
begin;
delete from public.defaults where key = 'themes_manifest';
commit;
