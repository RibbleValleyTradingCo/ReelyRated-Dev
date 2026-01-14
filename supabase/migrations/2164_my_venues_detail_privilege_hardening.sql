-- 2164_my_venues_detail_privilege_hardening.sql
-- Purpose: least-privilege hardening for /my/venues/:slug surface.
-- - Remove anon/PUBLIC EXECUTE on owner/admin mutation RPCs (defense in depth).
-- - Keep authenticated allowlist for mutations; preserve anon read access where needed.
-- - Remove anon/PUBLIC/authenticated table write privileges on venue-related tables.
-- Notes: This migration does not change RLS policies or table SELECT grants.

-- -------------------------------------------------------------------
-- A) Table grants: remove anon/PUBLIC/authenticated writes on venue-related tables
-- -------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.venue_rules,
  public.venue_opening_hours,
  public.venue_pricing_tiers,
  public.venue_species_stock,
  public.venue_owners,
  public.venues,
  public.venue_events,
  public.venue_photos
FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------------------
-- B) RPC EXECUTE allowlist for owner/admin mutation RPCs (auth-only)
-- -------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT
      n.nspname as schema_name,
      p.proname as routine_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    FROM pg_proc p
    JOIN pg_namespace n on n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'owner_update_venue_metadata',
        'owner_update_venue_event',
        'owner_create_venue_event',
        'owner_delete_venue_event',
        'owner_update_venue_rules',
        'admin_update_venue_rules',
        'owner_update_venue_booking',
        'admin_update_venue_booking',
        'owner_create_venue_opening_hour',
        'owner_update_venue_opening_hour',
        'owner_delete_venue_opening_hour',
        'admin_create_venue_opening_hour',
        'admin_update_venue_opening_hour',
        'admin_delete_venue_opening_hour',
        'owner_create_venue_pricing_tier',
        'owner_update_venue_pricing_tier',
        'owner_delete_venue_pricing_tier',
        'admin_create_venue_pricing_tier',
        'admin_update_venue_pricing_tier',
        'admin_delete_venue_pricing_tier',
        'owner_create_venue_species_stock',
        'owner_update_venue_species_stock',
        'owner_delete_venue_species_stock',
        'admin_create_venue_species_stock',
        'admin_update_venue_species_stock',
        'admin_delete_venue_species_stock',
        'owner_add_venue_photo',
        'owner_delete_venue_photo',
        'owner_set_venue_photo_primary',
        'admin_add_venue_photo',
        'admin_delete_venue_photo',
        'admin_set_venue_photo_primary'
      ])
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
  END LOOP;
END $$;

-- -------------------------------------------------------------------
-- C) Read/helper RPCs: explicit allowlist without breaking public pages
-- -------------------------------------------------------------------
-- get_venue_photos: keep anon for public pages; remove PUBLIC default.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT
      n.nspname as schema_name,
      p.proname as routine_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    FROM pg_proc p
    JOIN pg_namespace n on n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_venue_photos'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC',
      rec.schema_name,
      rec.routine_name,
      rec.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon',
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
  END LOOP;
END $$;

-- is_venue_admin_or_owner: keep anon/auth for policy evaluation; remove PUBLIC default.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT
      n.nspname as schema_name,
      p.proname as routine_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    FROM pg_proc p
    JOIN pg_namespace n on n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_venue_admin_or_owner'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC',
      rec.schema_name,
      rec.routine_name,
      rec.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon',
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
  END LOOP;
END $$;
