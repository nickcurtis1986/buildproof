-- Newer Supabase projects don't grant API roles access to new tables automatically.
-- Run this after 001_init.sql. Row Level Security (in 001) still decides which rows each person can see or change.
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- only the server (service role / cron) may recalculate rankings
revoke execute on function public.recompute_rank_scores() from public, anon, authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
