-- 80_REALTIME_POSTURE.sql
-- Best-effort realtime posture snapshot (single result set).
with pubs as (
  select
    'publication_table' as record_type,
    pt.pubname,
    pt.schemaname,
    pt.tablename,
    c.relrowsecurity,
    c.relforcerowsecurity,
    coalesce(p.policy_count, 0) as policy_count,
    null::text as gate_id,
    null::text as gate_reason
  from pg_publication_tables pt
  join pg_class c on c.relname = pt.tablename
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = pt.schemaname
  left join (
    select schemaname, tablename, count(*) as policy_count
    from pg_policies
    group by schemaname, tablename
  ) p on p.schemaname = pt.schemaname and p.tablename = pt.tablename
),
rls_gates as (
  select
    'gate' as record_type,
    pt.pubname,
    pt.schemaname,
    pt.tablename,
    c.relrowsecurity,
    c.relforcerowsecurity,
    coalesce(p.policy_count, 0) as policy_count,
    'GATE_PUB_TABLE_RLS_DISABLED' as gate_id,
    'Published table has RLS disabled' as gate_reason
  from pg_publication_tables pt
  join pg_class c on c.relname = pt.tablename
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = pt.schemaname
  left join (
    select schemaname, tablename, count(*) as policy_count
    from pg_policies
    group by schemaname, tablename
  ) p on p.schemaname = pt.schemaname and p.tablename = pt.tablename
  where c.relrowsecurity = false
)
select * from pubs
union all
select * from rls_gates
order by record_type, pubname, schemaname, tablename;
