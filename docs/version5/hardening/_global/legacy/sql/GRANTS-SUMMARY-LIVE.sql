-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

-- GRANTS-SUMMARY-LIVE.sql
-- Aggregate privilege counts by object type, schema, grantee, and privilege.
-- PUBLIC is a pseudo-role (grantee oid 0 in ACLs), so we pull schema/sequence grants via pg_catalog ACLs.
-- Avoids information_schema.schema_privileges and information_schema.sequence_privileges (not available here).

with target_grantees as (
  -- Real roles
  select r.oid, r.rolname
  from pg_roles r
  where r.rolname in ('anon', 'authenticated')

  union all
  -- service_role if present
  select r.oid, r.rolname
  from pg_roles r
  where r.rolname = 'service_role'

  union all
  -- PUBLIC pseudo-role represented as grantee oid 0 in ACLs
  select 0::oid as oid, 'PUBLIC'::text as rolname
),
non_system_schemas as (
  select n.oid as nsp_oid, n.nspname as schema_name, n.nspowner
  from pg_namespace n
  where n.nspname not like 'pg_%'
    and n.nspname <> 'information_schema'
),
-- Schema privileges (USAGE/CREATE) from namespace ACLs (includes PUBLIC)
schema_privs as (
  select
    'schema' as object_type,
    ns.schema_name,
    null::text as object_name,
    tg.rolname as grantee,
    ax.privilege_type,
    ax.is_grantable::text as is_grantable
  from non_system_schemas ns
  cross join lateral aclexplode(
    coalesce(
      (select n.nspacl from pg_namespace n where n.oid = ns.nsp_oid),
      acldefault('n', ns.nspowner)
    )
  ) as ax
  join target_grantees tg on tg.oid = ax.grantee
  where ax.privilege_type in ('USAGE', 'CREATE')
),
-- Table/view privileges from table_privileges (captures explicit + PUBLIC grants)
table_privs as (
  select
    'table' as object_type,
    tp.table_schema as schema_name,
    tp.table_name as object_name,
    tp.grantee,
    tp.privilege_type,
    tp.is_grantable
  from information_schema.table_privileges tp
  join non_system_schemas ns on ns.schema_name = tp.table_schema
  where tp.grantee in (select rolname from target_grantees)
),
-- Sequence privileges (USAGE/SELECT/UPDATE) from sequence ACLs (includes PUBLIC)
sequence_privs as (
  select
    'sequence' as object_type,
    n.nspname as schema_name,
    c.relname as object_name,
    tg.rolname as grantee,
    ax.privilege_type,
    ax.is_grantable::text as is_grantable
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join non_system_schemas ns on ns.schema_name = n.nspname
  cross join lateral aclexplode(
    coalesce(c.relacl, acldefault('S', c.relowner))
  ) as ax
  join target_grantees tg on tg.oid = ax.grantee
  where c.relkind = 'S'
    and ax.privilege_type in ('USAGE', 'SELECT', 'UPDATE')
),
-- Column-level privileges (optional; empty output means none for target roles)
column_privs as (
  select
    'column' as object_type,
    cg.table_schema as schema_name,
    cg.table_name || '.' || cg.column_name as object_name,
    cg.grantee,
    cg.privilege_type,
    cg.is_grantable
  from information_schema.role_column_grants cg
  join non_system_schemas ns on ns.schema_name = cg.table_schema
  where cg.grantee in (select rolname from target_grantees)
),
all_privs as (
  select * from schema_privs
  union all
  select * from table_privs
  union all
  select * from sequence_privs
  union all
  select * from column_privs
),
dedup as (
  select distinct * from all_privs
)
select
  object_type,
  schema_name,
  grantee,
  privilege_type,
  count(*) as grant_count,
  count(distinct object_name) as object_count
from dedup
group by object_type, schema_name, grantee, privilege_type
order by object_type, schema_name, grantee, privilege_type;
