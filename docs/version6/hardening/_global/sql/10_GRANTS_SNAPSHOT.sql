-- 10_GRANTS_SNAPSHOT.sql
-- Grants snapshot for schemas, relations, and sequences (roles of interest).
with target_grantees as (
  select r.oid, r.rolname
  from pg_roles r
  where r.rolname in ('anon', 'authenticated', 'service_role', 'postgres')
  union all
  select 0::oid as oid, 'PUBLIC'::text as rolname
),
non_system_schemas as (
  select n.oid as nsp_oid, n.nspname as schema_name, n.nspowner
  from pg_namespace n
  where n.nspname not like 'pg_%'
    and n.nspname <> 'information_schema'
),
-- Schema privileges via namespace ACLs
schema_privs as (
  select
    'schema' as object_type,
    ns.schema_name,
    null::text as object_name,
    null::text as relkind,
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
),
-- Relation privileges (tables/views/mviews)
rel_privs as (
  select
    'relation' as object_type,
    tp.table_schema as schema_name,
    tp.table_name as object_name,
    c.relkind::text as relkind,
    tp.grantee,
    tp.privilege_type,
    tp.is_grantable
  from information_schema.table_privileges tp
  join non_system_schemas ns on ns.schema_name = tp.table_schema
  join pg_class c
    on c.relname = tp.table_name
   and c.relnamespace = ns.nsp_oid
  where tp.grantee in (select rolname from target_grantees)
),
-- Sequence privileges via ACLs
sequence_privs as (
  select
    'sequence' as object_type,
    n.nspname as schema_name,
    c.relname as object_name,
    c.relkind::text as relkind,
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
),
all_privs as (
  select * from schema_privs
  union all
  select * from rel_privs
  union all
  select * from sequence_privs
)
select
  object_type,
  schema_name,
  object_name,
  relkind,
  grantee,
  privilege_type,
  is_grantable
from all_privs
order by object_type, schema_name, object_name nulls first, grantee, privilege_type;
