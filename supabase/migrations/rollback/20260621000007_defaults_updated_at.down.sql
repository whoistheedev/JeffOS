-- ROLLBACK for 20260621000007_defaults_updated_at
-- ⚠️ Re-introduces the update_holiday_theme upsert failure.
begin;
alter table public.defaults drop column if exists updated_at;
commit;
