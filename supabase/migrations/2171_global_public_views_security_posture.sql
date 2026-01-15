-- 2171_global_public_views_security_posture.sql
-- Purpose: tighten public view grants + enforce security_invoker=true where SELECT is granted.
-- Scope: public schema views only. No grants are added.

BEGIN;

DO $$
DECLARE
  v record;
BEGIN
  -- Revoke DML privileges for all public schema views (deterministic order).
  FOR v IN
    select c.relname as view_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
    order by c.relname
  LOOP
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM PUBLIC',
      'public',
      v.view_name
    );
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM anon',
      'public',
      v.view_name
    );
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON %I.%I FROM authenticated',
      'public',
      v.view_name
    );
  END LOOP;

  -- Enforce security_invoker for views that are selectable by PUBLIC/anon/authenticated.
  FOR v IN
    select c.relname as view_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and exists (
        select 1
        from information_schema.table_privileges tp
        where tp.table_schema = 'public'
          and tp.table_name = c.relname
          and tp.grantee in ('PUBLIC', 'anon', 'authenticated')
          and tp.privilege_type = 'SELECT'
      )
    order by c.relname
  LOOP
    EXECUTE format(
      'ALTER VIEW %I.%I SET (security_invoker = true)',
      'public',
      v.view_name
    );
  END LOOP;
END;
$$;

COMMIT;
