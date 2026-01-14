-- 2165_owner_get_read_rpc_priv_hardening.sql
-- Purpose: restrict owner_get_* read RPC exposure for /my/venues/:slug.
-- - Remove PUBLIC/anon EXECUTE where not public-safe.
-- - Keep authenticated + service_role.
-- - No signature/return-shape changes; privileges/search_path only.

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT
      n.nspname as schema_name,
      p.proname as routine_name,
      pg_get_function_identity_arguments(p.oid) as identity_args,
      COALESCE(
        (
          SELECT true
          FROM unnest(p.proconfig) cfg
          WHERE cfg = 'search_path=public, extensions'
          LIMIT 1
        ),
        false
      ) as has_standard_search_path
    FROM pg_proc p
    JOIN pg_namespace n on n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'owner_get_venue_events'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC',
      rec.schema_name,
      rec.routine_name,
      rec.identity_args
    );
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon',
      rec.schema_name,
      rec.routine_name,
      rec.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',
      rec.schema_name,
      rec.routine_name,
      rec.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      rec.schema_name,
      rec.routine_name,
      rec.identity_args
    );
    -- Re-apply the existing pinned search_path only if it is already set to this value.
    IF rec.has_standard_search_path THEN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = %L',
        rec.schema_name,
        rec.routine_name,
        rec.identity_args,
        'public, extensions'
      );
    END IF;
  END LOOP;
END $$;
