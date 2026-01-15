-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

-- GRANTS-REDFLAGS-PLATFORM-MANAGED.sql
-- Red-flag grant patterns limited to Supabase/platform-managed schemas (non-app surface).
-- Use this to track platform ACL noise separately from public schema lockdown metrics.

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
platform_schemas as (
  select n.oid as nsp_oid, n.nspname as schema_name, n.nspowner
  from pg_namespace n
  where n.nspname in (
    'auth',
    'storage',
    'extensions',
    'graphql',
    'graphql_public',
    'net',
    'realtime',
    'supabase_functions',
    'vault'
  )
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
  from platform_schemas ns
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
  join platform_schemas ps on ps.schema_name = tp.table_schema
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
  join platform_schemas ps on ps.schema_name = n.nspname
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
  join platform_schemas ps on ps.schema_name = cg.table_schema
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
)
select
  object_type,
  schema_name,
  object_name,
  grantee,
  privilege_type,
  is_grantable
from all_privs
where
(
  -- PUBLIC is very noisy; treat it as a red-flag only when it increases capability.
  grantee = 'PUBLIC'
  and (
    (object_type = 'schema' and privilege_type = 'CREATE')
    or (object_type = 'table' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'))
    or (object_type = 'sequence' and privilege_type = 'UPDATE')
  )
)
or (
  -- anon/auth writes are red-flags unless explicitly intended + fully controlled by RLS.
  grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
)
or (
  -- schema CREATE for anon/auth is almost always unintended.
  object_type = 'schema'
  and privilege_type = 'CREATE'
  and grantee in ('anon', 'authenticated')
)
or (
  -- sequence UPDATE for anon/auth is unusual; investigate.
  object_type = 'sequence'
  and privilege_type = 'UPDATE'
  and grantee in ('anon', 'authenticated')
)
order by object_type, schema_name, object_name nulls first, grantee, privilege_type;
