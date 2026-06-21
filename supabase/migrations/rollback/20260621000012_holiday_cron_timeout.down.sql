-- ROLLBACK for 20260621000012_holiday_cron_timeout (restore 1000ms)
begin;
select cron.alter_job(
  job_id  => 1,
  command => $cmd$
    select net.http_post(
      url:='https://akqqmrqeloasisiybdjx.supabase.co/functions/v1/update_holiday_theme',
      headers:=jsonb_build_object(),
      timeout_milliseconds:=1000
    );
  $cmd$
);
commit;
