-- 67_MULTIPLE_PERMISSIVE_POLICIES_BREAKDOWN.sql
-- Breakdown of multiple PERMISSIVE policies by table/command (public schema only).
-- Output is diff-friendly and ordered deterministically.
with policies as (
  select
    p.schemaname as schema_name,
    p.tablename as table_name,
    p.cmd,
    p.policyname,
    p.permissive,
    p.roles,
    p.qual,
    p.with_check
  from pg_policies p
  where p.schemaname = 'public'
),
roles_flat as (
  select
    schema_name,
    table_name,
    cmd,
    policyname,
    unnest(roles) as role_name
  from policies
  where permissive = 'PERMISSIVE'
),
permissive_counts as (
  select
    schema_name,
    table_name,
    cmd,
    count(*) filter (where permissive = 'PERMISSIVE') as permissive_policy_count,
    array_agg(policyname order by policyname)
      filter (where permissive = 'PERMISSIVE') as policy_names,
    (
      select array_agg(distinct rf.role_name order by rf.role_name)
      from roles_flat rf
      where rf.schema_name = policies.schema_name
        and rf.table_name = policies.table_name
        and rf.cmd = policies.cmd
    ) as roles
  from policies
  group by schema_name, table_name, cmd
),
permissive_counts_by_role as (
  select
    schema_name,
    table_name,
    cmd,
    role_name,
    count(*) as permissive_policy_count,
    array_agg(policyname order by policyname) as policy_names
  from roles_flat
  group by schema_name, table_name, cmd, role_name
),
flagged_by_role as (
  select *
  from permissive_counts_by_role
  where permissive_policy_count >= 2
),
flagged as (
  select *
  from permissive_counts
  where permissive_policy_count >= 2
),
combined as (
  select
    'summary_permissive' as record_type,
    f.schema_name,
    f.table_name,
    f.cmd,
    f.permissive_policy_count,
    f.policy_names,
    f.roles,
    null::text as policyname,
    null::text as permissive,
    null::text as qual,
    null::text as with_check
  from flagged f

  union all

  select
    'summary_by_role' as record_type,
    r.schema_name,
    r.table_name,
    r.cmd,
    r.permissive_policy_count,
    r.policy_names,
    array[r.role_name]::name[] as roles,
    null::text as policyname,
    null::text as permissive,
    null::text as qual,
    null::text as with_check
  from flagged_by_role r

  union all

  select
    'detail_all_policies' as record_type,
    f.schema_name,
    f.table_name,
    f.cmd,
    f.permissive_policy_count,
    f.policy_names,
    f.roles,
    p.policyname,
    p.permissive,
    p.qual,
    p.with_check
  from flagged f
  join policies p
    on p.schema_name = f.schema_name
   and p.table_name = f.table_name
   and p.cmd = f.cmd
)
select *
from combined
order by
  schema_name,
  table_name,
  cmd,
  case record_type
    when 'summary_permissive' then 0
    when 'summary_by_role' then 1
    else 2
  end,
  policyname;
