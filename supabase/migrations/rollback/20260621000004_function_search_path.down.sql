-- ROLLBACK for 20260621000004_function_search_path
begin;
alter function public.update_updated_at_column() reset search_path;
commit;
