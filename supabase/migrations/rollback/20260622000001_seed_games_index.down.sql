-- ROLLBACK for 20260622000001_seed_games_index
-- Removes the seeded rows; the client then falls back to bucket listing.
begin;
delete from public.games_index
where game_id in ('gba-contra-advance','nes-contra','nes-smb3','snes-sf5');
commit;
