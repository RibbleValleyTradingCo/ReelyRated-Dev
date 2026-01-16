-- 20_RLS_COVERAGE.sql
-- RLS coverage + gate outputs in a single result set.
with non_system_schemas as (
  select n.oid as nsp_oid, n.nspname as schema_name
  from pg_namespace n
  where n.nspname not like 'pg_%'
    and n.nspname <> 'information_schema'
),
rels as (
  select
    n.schema_name as schema_name,
    c.relname as relation_name,
    c.relkind,
    c.relowner::regrole as owner_role,
    c.relrowsecurity,
    c.relforcerowsecurity
  from pg_class c
  join non_system_schemas n on n.nsp_oid = c.relnamespace
  where c.relkind in ('r','p')
),
policy_counts as (
  select schemaname, tablename, count(*) as policy_count
  from pg_policies
  where schemaname in (select schema_name from non_system_schemas)
  group by schemaname, tablename
),
rel_grants as (
  select
    tp.table_schema as schema_name,
    tp.table_name as relation_name,
    tp.grantee,
    tp.privilege_type
  from information_schema.table_privileges tp
  where tp.grantee in ('PUBLIC','anon','authenticated')
),
coverage as (
  select
    'coverage' as record_type,
    r.schema_name,
    r.relation_name,
    r.relkind,
    r.owner_role,
    r.relrowsecurity,
    r.relforcerowsecurity,
    coalesce(p.policy_count, 0) as policy_count,
    null::text as gate_id,
    null::text as gate_reason,
    null::text as grantee,
    null::text as privilege_type
  from rels r
  left join policy_counts p
    on p.schemaname = r.schema_name and p.tablename = r.relation_name
),
rls_disabled_exposed as (
  select
    'gate' as record_type,
    r.schema_name,
    r.relation_name,
    r.relkind,
    r.owner_role,
    r.relrowsecurity,
    r.relforcerowsecurity,
    coalesce(p.policy_count, 0) as policy_count,
    'GATE_RLS_DISABLED_EXPOSED' as gate_id,
    'RLS disabled but grants exist for anon/auth/PUBLIC' as gate_reason,
    g.grantee,
    g.privilege_type
  from rels r
  join rel_grants g
    on g.schema_name = r.schema_name and g.relation_name = r.relation_name
  left join policy_counts p
    on p.schemaname = r.schema_name and p.tablename = r.relation_name
  where r.relrowsecurity = false
),
rls_enabled_no_policies as (
  select
    'gate' as record_type,
    r.schema_name,
    r.relation_name,
    r.relkind,
    r.owner_role,
    r.relrowsecurity,
    r.relforcerowsecurity,
    coalesce(p.policy_count, 0) as policy_count,
    'GATE_RLS_ENABLED_NO_POLICIES' as gate_id,
    'RLS enabled but no policies' as gate_reason,
    null::text as grantee,
    null::text as privilege_type
  from rels r
  left join policy_counts p
    on p.schemaname = r.schema_name and p.tablename = r.relation_name
  where r.relrowsecurity = true
    and coalesce(p.policy_count, 0) = 0
)
select * from coverage
union all
select * from rls_disabled_exposed
union all
select * from rls_enabled_no_policies
order by record_type, schema_name, relation_name, gate_id nulls last, grantee nulls last, privilege_type nulls last;
