-- ============================================================================
-- Migration: 20260621000011_themes_manifest
-- Phase:     5 — Priority 5 (Asset delivery): P5.2, S3
-- Source of truth: PHASE5_IMPLEMENTATION.md §P5.2
-- ----------------------------------------------------------------------------
-- WHAT:  Seed a themes_manifest row in public.defaults mapping themeId ->
--        wallpaper URL, so the client reads ONE row instead of HEAD-probing up
--        to 32 candidate URLs per boot (src/config/themes.ts).
--
-- WHY:   themes.ts brute-forces 4 file extensions per theme via fetch(HEAD) at
--        startup (the ~32-request boot cost, audit S3). A manifest removes it.
--
-- DATA:  The URLs below are the live, verified public URLs captured from the
--        running app's theme loader (the `✅ theme_x: <url>` console lines).
--        theme_eid has NO wallpaper on the bucket (loader logged "No wallpaper
--        found" -> "Loaded 7/8"), so it is intentionally omitted/null.
--        These are public bucket URLs, not secrets.
--
-- SAFETY: Single upsert into the existing k/v defaults table. Reversible
--         (delete the row). Requires migration ...0007 (defaults.updated_at).
--         Client switch to read this manifest is a paired change in themes.ts.
-- ============================================================================

begin;

insert into public.defaults (key, value)
values (
  'themes_manifest',
  json_build_object(
    'theme_new_year',              'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/new_year.jpg',
    'theme_valentines',            'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/valentines.jpg',
    'theme_halloween',             'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/halloween.jpg',
    'theme_thanksgiving',          'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/thanksgiving.jpg',
    'theme_christmas',             'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/christmas.png',
    'theme_cny',                   'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/cny.jpg',
    'theme_eid',                   null,
    'theme_nigeria_independence',  'https://akqqmrqeloasisiybdjx.supabase.co/storage/v1/object/public/themes/wallpapers/nigeria_independence.jpg'
  )::text
)
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;
