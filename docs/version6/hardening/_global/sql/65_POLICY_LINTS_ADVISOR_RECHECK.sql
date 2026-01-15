-- 65_POLICY_LINTS_ADVISOR_RECHECK.sql
-- Lists pg_policies for tables flagged by advisor lints:
-- - auth_rls_initplan
-- - multiple_permissive_policies
--
-- NOTE: Populate lint_tables from advisor output before running.
-- Example:
--   values
--     ('public', 'my_table'),
--     ('public', 'other_table')
with lint_tables(schema_name, tablename) as (
  values
    ('public','admin_users'),
    ('public','catch_comments'),
    ('public','catch_reactions'),
    ('public','catches'),
    ('public','moderation_log'),
    ('public','notifications'),
    ('public','profile_blocks'),
    ('public','profile_follows'),
    ('public','rate_limits'),
    ('public','ratings'),
    ('public','reports'),
    ('public','sessions'),
    ('public','user_warnings'),
    ('public','venue_owners'),
    ('public','venue_ratings'),
    ('public','venues')
),
policies as (
  select
    p.schemaname,
    p.tablename,
    p.cmd,
    p.roles,
    p.policyname,
    p.permissive,
    p.qual,
    p.with_check,
    (
      lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%auth.uid()%'
      or lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%auth.role()%'
      or lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%current_setting(%'
    ) as contains_auth_call
  from pg_policies p
  join lint_tables lt
    on lt.schema_name = p.schemaname
   and lt.tablename = p.tablename
)
select
  schemaname as schema_name,
  tablename,
  cmd,
  roles,
  policyname,
  permissive,
  qual,
  with_check,
  contains_auth_call
from policies
order by tablename, policyname, cmd;
