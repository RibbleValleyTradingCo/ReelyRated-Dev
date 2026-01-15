-- 68_0006_SOFT_DELETE_VISIBILITY_CHECK.sql
-- Heuristic check: owner/self policies without deleted_at filter can expose soft-deleted rows.
-- PERMISSIVE policies OR together, so any owner/self policy missing deleted_at IS NULL
-- will allow owners to see deleted rows even if other policies filter them.
with target_tables(schema_name, table_name) as (
  values
    ('public', 'catches'),
    ('public', 'catch_comments')
),
policies as (
  select
    p.schemaname,
    p.tablename,
    p.cmd,
    p.policyname,
    p.roles,
    p.permissive,
    p.qual,
    p.with_check,
    lower(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) as policy_text,
    lower(coalesce(p.qual, '')) as qual_text
  from pg_policies p
  join target_tables t
    on t.schema_name = p.schemaname
   and t.table_name = p.tablename
)
select
  tablename as table_name,
  cmd,
  policyname,
  roles,
  permissive,
  (policy_text ~* 'deleted_at[[:space:]]+is[[:space:]]+null') as references_deleted_at,
  (
    policy_text ~* E'auth[[:space:]]*\\.[[:space:]]*uid[[:space:]]*\\([[:space:]]*\\)[[:space:]]*=[[:space:]]*user_id'
    or policy_text ~* E'user_id[[:space:]]*=[[:space:]]*auth[[:space:]]*\\.[[:space:]]*uid[[:space:]]*\\([[:space:]]*\\)'
    or policy_text ~* E'uid[[:space:]]*\\([[:space:]]*\\)[[:space:]]*=[[:space:]]*user_id'
    or policy_text ~* E'user_id[[:space:]]*=[[:space:]]*uid[[:space:]]*\\([[:space:]]*\\)'
  ) as matches_owner_self_clause,
  (policy_text ~* 'deleted_at[[:space:]]+is[[:space:]]+null') as matches_deleted_filter,
  (
    roles is null
    or roles && array['public'::name, 'authenticated'::name]
  ) as matches_role_scope,
  (
    permissive = 'PERMISSIVE'
    and cmd = 'SELECT'
    and (
      policy_text ~* E'auth[[:space:]]*\\.[[:space:]]*uid[[:space:]]*\\([[:space:]]*\\)[[:space:]]*=[[:space:]]*user_id'
      or policy_text ~* E'user_id[[:space:]]*=[[:space:]]*auth[[:space:]]*\\.[[:space:]]*uid[[:space:]]*\\([[:space:]]*\\)'
      or policy_text ~* E'uid[[:space:]]*\\([[:space:]]*\\)[[:space:]]*=[[:space:]]*user_id'
      or policy_text ~* E'user_id[[:space:]]*=[[:space:]]*uid[[:space:]]*\\([[:space:]]*\\)'
    )
    and not (policy_text ~* 'deleted_at[[:space:]]+is[[:space:]]+null')
    and (
      roles is null
      or roles && array['public'::name, 'authenticated'::name]
    )
  ) as owner_can_see_deleted_risk,
  qual,
  with_check
from policies
order by table_name, cmd, policyname;
