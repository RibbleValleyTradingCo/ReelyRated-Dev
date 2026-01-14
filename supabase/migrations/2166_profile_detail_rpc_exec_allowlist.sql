-- 2166_profile_detail_rpc_exec_allowlist.sql
-- Purpose: enforce auth-only EXECUTE allowlists for profile-detail RPCs.
-- - Removes PUBLIC/anon EXECUTE on auth-only RPCs.
-- - Keeps authenticated + service_role.
-- - No signature/return-shape changes; privileges only.
-- Uses regprocedure to target overloads precisely.
-- Scope: targets ALL overloads in schema "public" for the pronames listed (pg_proc + oid::regprocedure).

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n on n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_follower_count', 'block_profile')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', rec.oid::regprocedure);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', rec.oid::regprocedure);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', rec.oid::regprocedure);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', rec.oid::regprocedure);
  END LOOP;
END $$;
