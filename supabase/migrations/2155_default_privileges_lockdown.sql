-- P0 default privileges lockdown (prevent future over-grants)
-- Truth-only: this migration uses pg_default_acl to target default ACLs that grant to PUBLIC/anon/authenticated.
-- If no default ACL entries exist, this is a no-op.
-- Scope: public schema + custom (non-system) schemas; excludes Supabase-managed schemas.
--
-- Probe (run before/after):
-- select
--   coalesce(n.nspname, '<all_schemas>') as schema_name,
--   r.rolname as owner_role,
--   d.defaclobjtype,
--   d.defaclacl
-- from pg_default_acl d
-- join pg_roles r on r.oid = d.defaclrole
-- left join pg_namespace n on n.oid = d.defaclnamespace
-- order by schema_name, owner_role, d.defaclobjtype;

DO $$
DECLARE
  rec record;
BEGIN
  RAISE NOTICE 'default-privs lockdown: current_user=% session_user=%', current_user, session_user;

  FOR rec IN
    SELECT DISTINCT
      pr.rolname as owner_role,
      d.defaclnamespace,
      n.nspname as schema_name
    FROM pg_default_acl d
    JOIN pg_roles pr ON pr.oid = d.defaclrole
    LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
    JOIN LATERAL aclexplode(coalesce(d.defaclacl, '{}'::aclitem[])) acl ON true
    LEFT JOIN pg_roles gr ON gr.oid = acl.grantee
    WHERE (acl.grantee = 0 OR gr.rolname IN ('anon', 'authenticated'))
      AND NOT pg_has_role(current_user, d.defaclrole, 'member')
      AND (d.defaclnamespace = 0 OR n.nspname IS NOT NULL)
      AND (
        (d.defaclnamespace <> 0 AND (
          n.nspname = 'public'
          OR (
            n.nspname NOT LIKE 'pg_%'
            AND n.nspname <> 'information_schema'
            AND n.nspname NOT IN (
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
          )
        ))
        OR (d.defaclnamespace = 0 AND pr.rolname = 'postgres')
      )
  LOOP
    RAISE NOTICE 'default-privs lockdown: skipping owner_role=% schema=% (not a member of defaclrole)',
      rec.owner_role, coalesce(rec.schema_name, '<all_schemas>');
  END LOOP;

  FOR rec IN
    SELECT DISTINCT
      pr.rolname as owner_role,
      d.defaclnamespace,
      n.nspname as schema_name
    FROM pg_default_acl d
    JOIN pg_roles pr ON pr.oid = d.defaclrole
    LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
    JOIN LATERAL aclexplode(coalesce(d.defaclacl, '{}'::aclitem[])) acl ON true
    LEFT JOIN pg_roles gr ON gr.oid = acl.grantee
    WHERE (acl.grantee = 0 OR gr.rolname IN ('anon', 'authenticated'))
      AND pg_has_role(current_user, d.defaclrole, 'member')
      AND (d.defaclnamespace = 0 OR n.nspname IS NOT NULL)
      AND (
        (d.defaclnamespace <> 0 AND (
          n.nspname = 'public'
          OR (
            n.nspname NOT LIKE 'pg_%'
            AND n.nspname <> 'information_schema'
            AND n.nspname NOT IN (
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
          )
        ))
        OR (d.defaclnamespace = 0 AND pr.rolname = 'postgres')
      )
  LOOP
    BEGIN
      IF rec.defaclnamespace = 0 THEN
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated',
          rec.owner_role
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated',
          rec.owner_role
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated',
          rec.owner_role
        );
      ELSE
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated',
          rec.owner_role,
          rec.schema_name
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated',
          rec.owner_role,
          rec.schema_name
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated',
          rec.owner_role,
          rec.schema_name
        );
      END IF;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'default-privs lockdown: insufficient_privilege for owner_role=% schema=%; skipping',
        rec.owner_role, coalesce(rec.schema_name, '<all_schemas>');
    END;
  END LOOP;
END $$;
