-- ============================================================================
-- Migration: 20260622000001_seed_games_index
-- Phase:     1 perf — populate the games_index manifest (P5.1 follow-up)
-- ----------------------------------------------------------------------------
-- WHAT:  Seed public.games_index with the ROMs currently in the `games` bucket
--        so game discovery is ONE indexed query instead of storage list() calls.
--
-- WHY:   EmulatorApp reads games_index first (Phase 1 client change). The table
--        was created in Phase 5 but never populated (0 rows), so the client
--        fell back to listing the bucket. This seeds it from the live bucket
--        contents (4 ROMs across gba/nes/snes, mapped to their thumbs).
--
-- SAFETY: Idempotent upsert on game_id (PK). Pure data; no schema change.
--         If the bucket changes, re-run with updated rows (a future Edge
--         Function / cron should automate this on upload). Reversible: delete
--         the seeded rows (companion .down.sql).
--
-- NOTE:   rom_path / thumb_path are bucket-relative; the client prefixes them
--         with the public storage base. thumb_path mapping verified against
--         live storage.objects on 2026-06-22.
-- ============================================================================

begin;

insert into public.games_index (game_id, system, title, rom_path, thumb_path, updated_at)
values
  ('gba-contra-advance', 'gba',  'Contra Advance the Alien Wars',
     'gba/Contra Advance the Alien Wars.GBA',  'thumbs/Contra Advance the Alien Wars.webp', now()),
  ('nes-contra',         'nes',  'Contra (USA)',
     'nes/Contra (USA).nes',                   'thumbs/Contra (USA).webp',                  now()),
  ('nes-smb3',           'nes',  'Super Mario Bros. 3 (USA) (Rev 1)',
     'nes/Super Mario Bros. 3 (USA) (Rev 1).nes', 'thumbs/Super Mario Bros. 3 (USA) (Rev 1).jpeg', now()),
  ('snes-sf5',           'snes', 'Street Fighter 5 (Hack)',
     'snes/Street Fighter 5 (Hack).smc',       'thumbs/Street Fighter 5 (Hack).jpg',        now())
on conflict (game_id) do update set
  system     = excluded.system,
  title      = excluded.title,
  rom_path   = excluded.rom_path,
  thumb_path = excluded.thumb_path,
  updated_at = now();

commit;
