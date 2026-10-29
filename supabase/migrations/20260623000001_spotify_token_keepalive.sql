-- ============================================================================
-- Migration: 20260623000001_spotify_token_keepalive
-- Phase:     iTunes — keep Spotify "personal" mode alive
-- ----------------------------------------------------------------------------
-- WHAT:  A pg_cron job that calls the `spotify-token` Edge Function every 30
--        minutes via pg_net (async HTTP). Each call performs a refresh_token
--        grant against Spotify, which exercises the stored SPOTIFY_REFRESH_TOKEN.
--
-- WHY:   Spotify can invalidate a refresh token that goes unused for a long
--        time. If that happens, spotify-token silently falls back to
--        client_credentials (30-second previews) and full-track "personal"
--        playback is lost. Regularly exercising the refresh token keeps it warm
--        so personal mode stays available even during quiet periods with no
--        visitors. (Note: this does NOT stream audio server-side — playback
--        still happens in a visitor's browser via the Web Playback SDK. This
--        only keeps the credential alive.)
--
-- SECURITY: spotify-token has verify_jwt=false and returns only a short-lived,
--        scoped access token (never the refresh token or client secret), so an
--        unauthenticated keep-warm call is safe. No secrets are stored in SQL.
--
-- SAFETY: idempotent (unschedules any prior job of the same name first);
--        reversible (.down.sql). Requires pg_cron + pg_net (both installed).
-- ============================================================================

begin;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Idempotency: drop a previously scheduled job with this name, if present.
do $$
begin
  perform cron.unschedule('spotify-token-keepalive')
  where exists (select 1 from cron.job where jobname = 'spotify-token-keepalive');
end $$;

-- Every 30 minutes, fire-and-forget an HTTP GET at the Edge Function. pg_net is
-- async: the request is queued and the cron tick returns immediately.
select cron.schedule(
  'spotify-token-keepalive',
  '*/30 * * * *',
  $cron$
    select net.http_get(
      url     := 'https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/spotify-token',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 8000
    );
  $cron$
);

commit;
