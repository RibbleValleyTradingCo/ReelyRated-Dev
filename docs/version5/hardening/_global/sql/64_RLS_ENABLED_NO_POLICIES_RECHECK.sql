-- 64_RLS_ENABLED_NO_POLICIES_RECHECK.sql
-- Recheck for RLS enabled but no policies (public-only scope; 0 rows = PASS).
with in_scope_schemas as (
  select 'public'::text as schema_name
),
in_scope_tables as (
  select
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join in_scope_schemas s on s.schema_name = n.nspname
  where c.relkind in ('r','p')
),
policy_counts as (
  select
    schemaname,
    tablename,
    count(*) as policy_count
  from pg_policies
  where schemaname in (select schema_name from in_scope_schemas)
  group by schemaname, tablename
)
select
  t.schema_name,
  t.table_name,
  coalesce(p.policy_count, 0) as policy_count,
  'GATE_RLS_ENABLED_NO_POLICIES' as gate_id
from in_scope_tables t
left join policy_counts p
  on p.schemaname = t.schema_name and p.tablename = t.table_name
where t.relrowsecurity = true
  and coalesce(p.policy_count, 0) = 0
order by t.schema_name, t.table_name;
