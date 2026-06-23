-- ============================================================================
-- Migration: 20260623000002_spotify_refresh_token_reader
-- Phase:     iTunes — read the Spotify refresh token from Vault
-- ----------------------------------------------------------------------------
-- WHAT:  A locked-down reader so the `spotify-token` edge function can fetch the
--        Spotify refresh token from Supabase Vault via RPC, instead of an env
--        secret. The token itself lives in vault.secrets (name
--        'spotify_refresh_token') — created out-of-band via vault.create_secret,
--        NOT in this migration (no secret material in source control).
--
-- WHY:   Keeps the long-lived refresh token in Vault (encrypted at rest) and out
--        of the function's plaintext env. The function reads it at runtime with
--        the auto-injected service-role key.
--
-- SECURITY: SECURITY DEFINER (reads vault) but EXECUTE is granted ONLY to
--        service_role — anon/authenticated are revoked, so the public anon key
--        can never pull the refresh token. search_path pinned.
--
-- SAFETY: reversible (.down.sql). Does not touch the secret value.
-- ============================================================================

create or replace function public.get_spotify_refresh_token()
  returns text
  language sql
  stable
  security definer
  set search_path = vault, public
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'spotify_refresh_token'
  limit 1
$$;

revoke all on function public.get_spotify_refresh_token() from public, anon, authenticated;
grant execute on function public.get_spotify_refresh_token() to service_role;
