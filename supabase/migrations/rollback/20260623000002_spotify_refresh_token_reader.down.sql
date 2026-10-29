-- Rollback for 20260623000002_spotify_refresh_token_reader
-- Drops the Vault reader. Does NOT delete the Vault secret itself.
-- (After this, spotify-token falls back to the SPOTIFY_REFRESH_TOKEN env var.)
drop function if exists public.get_spotify_refresh_token();
