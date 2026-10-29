-- Rollback for 20260623000001_spotify_token_keepalive
-- Unschedules the keep-warm cron job. Leaves the pg_cron/pg_net extensions
-- installed (other jobs may rely on them).
begin;

do $$
begin
  perform cron.unschedule('spotify-token-keepalive')
  where exists (select 1 from cron.job where jobname = 'spotify-token-keepalive');
end $$;

commit;
