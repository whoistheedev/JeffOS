-- ROLLBACK for 20260621000006_rankings_sargable_typefix
-- ⚠️ Restores the pre-Phase-5 definitions: anon_id uuid (errors on real text
--    data), non-sargable created_at::date, no search_path. Prefer fixing forward.
begin;

create or replace function public.get_rankings_all(g_id text)
  returns table(anon_id uuid, score integer) language sql stable as $function$
  select anon_id, max(score) as score
  from game_scores where game_id = g_id group by anon_id order by score desc
$function$;

create or replace function public.get_rankings_today(g_id text, d date)
  returns table(anon_id uuid, score integer) language sql stable as $function$
  select anon_id, max(score) as score
  from game_scores where game_id = g_id and created_at::date = d
  group by anon_id order by score desc
$function$;

create or replace function public.rank_alltime(gameid text, score_input integer)
  returns integer language sql stable as $function$
  select count(*) + 1 from game_scores where game_id = gameid and score > score_input;
$function$;

create or replace function public.rank_today(gameid text, score_input integer)
  returns integer language sql stable as $function$
  select count(*) + 1 from game_scores
  where game_id = gameid and created_at::date = now()::date and score > score_input;
$function$;

commit;
