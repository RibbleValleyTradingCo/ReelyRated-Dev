-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

-- RLS coverage snapshot across target schemas (public, storage).
-- relkind: r=table, p=partitioned table, v=view, m=materialized view, f=foreign table.
with rels as (
  select
    n.nspname as schemaname,
    c.relname,
    c.relkind,
    c.relowner::regrole as owner,
    c.relrowsecurity,
    c.relforcerowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'storage')
)
select
  rels.schemaname,
  rels.relname,
  rels.relkind,
  rels.owner,
  rels.relrowsecurity,
  rels.relforcerowsecurity,
  coalesce(p.policy_count, 0) as policy_count
from rels
left join (
  select schemaname, tablename, count(*) as policy_count
  from pg_policies
  where schemaname in ('public', 'storage')
  group by schemaname, tablename
) p
  on p.schemaname = rels.schemaname and p.tablename = rels.relname
order by rels.schemaname, rels.relname;
