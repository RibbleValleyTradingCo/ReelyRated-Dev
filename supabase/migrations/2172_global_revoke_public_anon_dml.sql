-- 2172_global_revoke_public_anon_dml.sql
-- Purpose: public schema only; revoke PUBLIC/anon DML-style privileges on tables/views.
-- Non-goals: DML only; no SELECT changes; no grants; no RLS changes.
-- PASS criteria: 0 rows in 62_PUBLIC_ANON_DML_RECHECK (scoped to public).

BEGIN;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    select
      tp.table_schema as schema_name,
      tp.table_name,
      tp.grantee,
      tp.privilege_type
    from information_schema.table_privileges tp
    where tp.table_schema = 'public'
      and tp.grantee in ('PUBLIC', 'anon')
      and tp.privilege_type in (
        'INSERT',
        'UPDATE',
        'DELETE',
        'TRUNCATE',
        'REFERENCES',
        'TRIGGER'
      )
    order by tp.table_schema, tp.table_name, tp.grantee, tp.privilege_type
  LOOP
    IF r.grantee = 'PUBLIC' THEN
      EXECUTE format(
        'REVOKE %s ON TABLE %I.%I FROM PUBLIC',
        r.privilege_type,
        r.schema_name,
        r.table_name
      );
    ELSE
      EXECUTE format(
        'REVOKE %s ON TABLE %I.%I FROM %I',
        r.privilege_type,
        r.schema_name,
        r.table_name,
        r.grantee
      );
    END IF;
  END LOOP;
END;
$$;

COMMIT;
