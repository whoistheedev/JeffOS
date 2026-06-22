-- ROLLBACK for 20260621000009_publish_guestbook_realtime
begin;
alter publication supabase_realtime drop table public.guestbook;
commit;
