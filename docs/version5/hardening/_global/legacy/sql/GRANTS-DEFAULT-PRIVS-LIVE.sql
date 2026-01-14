-- ⚠️ LEGACY (archived 2026-01-13)
-- Preserved v1 global probe/notes for audit/history.
-- Current work lives in: docs/version5/hardening/_global/v2/ (see _global/README.md).
-- Do not modify semantics here; only edit if fixing broken internal legacy links/comments.

-- GRANTS-DEFAULT-PRIVS-LIVE.sql
-- Default privileges can silently re-open access for future objects.
-- Review any defaults that include anon/authenticated/PUBLIC/service_role.

select
  coalesce(n.nspname, '(all schemas)') as schema_name,
  r.rolname as owner,
  case d.defaclobjtype
    when 'r' then 'tables'
    when 'S' then 'sequences'
    when 'f' then 'functions'
    when 'T' then 'types'
    when 'n' then 'schemas'
    else d.defaclobjtype::text
  end as object_type,
  d.defaclacl as acl
from pg_default_acl d
join pg_roles r on r.oid = d.defaclrole
left join pg_namespace n on n.oid = d.defaclnamespace
order by schema_name, owner, object_type;
