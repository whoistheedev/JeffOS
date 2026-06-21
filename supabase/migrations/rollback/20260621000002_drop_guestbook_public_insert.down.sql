-- ROLLBACK for 20260621000002_drop_guestbook_public_insert
-- ⚠️ NOT RECOMMENDED: reverting re-opens SEC-2 (guestbook Edge Function bypass).
-- Provided only for emergency reversibility. Prefer fixing forward.
begin;
create policy "Public insert"
  on public.guestbook for insert
  to public
  with check (true);
commit;
