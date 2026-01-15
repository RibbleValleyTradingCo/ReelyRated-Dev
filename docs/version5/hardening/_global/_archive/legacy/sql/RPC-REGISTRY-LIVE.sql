-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

-- RPC-REGISTRY-LIVE.sql
-- Live EXECUTE grants for routines in target schemas.
-- Includes role_routine_grants (explicit) and routine_privileges (PUBLIC grants).

with target_roles as (
  select 'anon' as rolname
  union all select 'authenticated'
  union all select 'PUBLIC'
  union all select rolname from pg_roles where rolname = 'service_role'
),
target_schemas as (
  select 'public' as schema_name
),
registry as (
  select
    g.grantor,
    g.grantee,
    g.specific_schema as schema_name,
    g.routine_name,
    g.specific_name,
    g.privilege_type
  from information_schema.role_routine_grants g
  join target_roles tr on tr.rolname = g.grantee
  join target_schemas ts on ts.schema_name = g.specific_schema

  union all

  select
    g.grantor,
    g.grantee,
    g.specific_schema as schema_name,
    g.routine_name,
    g.specific_name,
    g.privilege_type
  from information_schema.routine_privileges g
  join target_roles tr on tr.rolname = g.grantee
  join target_schemas ts on ts.schema_name = g.specific_schema
),
proc_meta as (
  select
    n.nspname as schema_name,
    p.proname as routine_name,
    p.oid,
    pg_get_function_identity_arguments(p.oid) as identity_args,
    p.prokind
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join target_schemas ts on ts.schema_name = n.nspname
)
select
  r.grantor,
  r.grantee,
  r.schema_name,
  r.routine_name,
  r.specific_name,
  r.privilege_type,
  pm.oid,
  pm.identity_args,
  pm.prokind
from registry r
left join proc_meta pm
  on pm.schema_name = r.schema_name
 and pm.routine_name = r.routine_name
order by r.schema_name, r.routine_name, pm.identity_args, r.grantee, r.privilege_type;
