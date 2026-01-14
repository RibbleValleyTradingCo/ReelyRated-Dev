-- MY-VENUES-DETAIL-PROBES.sql
-- Probe pack for /my/venues/:slug (my-venues-detail).
-- Evidence output folder: docs/version5/hardening/surfaces/my-venues-detail/evidence/sql/
-- Suggested outputs:
--   - SQL_my-venues-detail_grants_YYYY-MM-DD.txt
--   - SQL_my-venues-detail_rls_policies_YYYY-MM-DD.txt
--   - SQL_my-venues-detail_rpc_posture_YYYY-MM-DD.txt
--   - SQL_my-venues-detail_routine_privileges_YYYY-MM-DD.txt
--   - SQL_my-venues-detail_storage_policies_YYYY-MM-DD.txt
--   - SQL_my-venues-detail_storage_objects_YYYY-MM-DD.txt
-- Read-only probes only (SELECTs only).

-- ------------------------------------------------------------
-- 0) Discovery commands (COMMENTS ONLY)
-- ------------------------------------------------------------
-- rg -n "supabase\.rpc\(" src/pages/my-venues src/pages/venue-owner-admin -S
-- rg -n "rpcName|createRpc|updateRpc|deleteRpc" src/pages/my-venues src/pages/venue-owner-admin -S
-- rg -n "RulesCard|OpeningHoursCard|PricingTiersCard|SpeciesStockCard|VenuePhotosCard|BookingCard" src/pages -S
-- rg -n "owner_\w+|venue_\w+|photo_\w+|rules_\w+|pricing_\w+|opening_hours_\w+|species_\w+|booking_\w+" src/pages/my-venues src/pages/venue-owner-admin -S
-- rg -n "venue-photos|storage\.from\(" src/pages/my-venues src/pages/venue-owner-admin -S
-- After discovery, replace <DYNAMIC_RPC_LIST> placeholders below with concrete RPC names. (Now replaced; keep the lists below in sync.)
-- DISCOVERED RPC NAMES (from rg on <today’s date>):
-- - owner_update_venue_rules
-- - admin_update_venue_rules
-- - owner_update_venue_booking
-- - admin_update_venue_booking
-- - owner_create_venue_opening_hour
-- - owner_update_venue_opening_hour
-- - owner_delete_venue_opening_hour
-- - admin_create_venue_opening_hour
-- - admin_update_venue_opening_hour
-- - admin_delete_venue_opening_hour
-- - owner_create_venue_pricing_tier
-- - owner_update_venue_pricing_tier
-- - owner_delete_venue_pricing_tier
-- - admin_create_venue_pricing_tier
-- - admin_update_venue_pricing_tier
-- - admin_delete_venue_pricing_tier
-- - owner_create_venue_species_stock
-- - owner_update_venue_species_stock
-- - owner_delete_venue_species_stock
-- - admin_create_venue_species_stock
-- - admin_update_venue_species_stock
-- - admin_delete_venue_species_stock
-- - owner_add_venue_photo
-- - owner_delete_venue_photo
-- - owner_set_venue_photo_primary
-- - admin_add_venue_photo
-- - admin_delete_venue_photo
-- - admin_set_venue_photo_primary
-- - get_venue_photos

-- ------------------------------------------------------------
-- A) Table grants snapshot (PUBLIC/anon/authenticated)
-- ------------------------------------------------------------
select
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'venue_rules',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_species_stock',
    'venue_owners',
    'venues',
    'venue_events',
    'venue_photos'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- If this returns 0 rows, that’s fine; Supabase commonly uses anon/authenticated roles.
select
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'venue_rules',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_species_stock',
    'venue_owners',
    'venues',
    'venue_events',
    'venue_photos'
  )
  and grantee = 'PUBLIC'
order by table_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- B) RLS posture + policies
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind,
  c.relowner::regrole as owner_role,
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'venue_rules',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_species_stock',
    'venue_owners',
    'venues',
    'venue_events',
    'venue_photos'
  )
order by n.nspname, c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'venue_rules',
    'venue_opening_hours',
    'venue_pricing_tiers',
    'venue_species_stock',
    'venue_owners',
    'venues',
    'venue_events',
    'venue_photos'
  )
order by tablename, policyname;

-- ------------------------------------------------------------
-- C) RPC posture (pg_proc)
-- ------------------------------------------------------------
select
  n.nspname as schema_name,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  p.prosecdef as is_security_definer,
  p.proowner::regrole as owner_role,
  p.proacl,
  (
    select regexp_replace(cfg, '^search_path=', '')
    from unnest(p.proconfig) cfg
    where cfg like 'search_path=%'
    limit 1
  ) as search_path_value,
  (
    select cfg is not null
    from unnest(p.proconfig) cfg
    where cfg like 'search_path=%'
    limit 1
  ) as search_path_pinned
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'owner_get_venue_by_slug',
    'owner_get_venue_events',
    'owner_update_venue_metadata',
    'owner_update_venue_event',
    'owner_create_venue_event',
    'owner_delete_venue_event',
    'get_venue_photos',
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
    'admin_set_venue_photo_primary',
    'is_venue_admin_or_owner'
  )
order by p.proname, identity_args;

-- ------------------------------------------------------------
-- D) routine_privileges for RPC list
-- ------------------------------------------------------------
select
  routine_schema,
  routine_name,
  specific_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'owner_get_venue_by_slug',
    'owner_get_venue_events',
    'owner_update_venue_metadata',
    'owner_update_venue_event',
    'owner_create_venue_event',
    'owner_delete_venue_event',
    'get_venue_photos',
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
    'admin_set_venue_photo_primary',
    'is_venue_admin_or_owner'
  )
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'postgres', 'service_role')
order by routine_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- E) Storage policies (venue photos)
-- ------------------------------------------------------------
-- Bucket likely: venue-photos; confirm in code before relying on this.
select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
order by pol.polname;

select
  pol.polname as policyname,
  pol.polcmd,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as qual,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage'
  and c.relname = 'objects'
  and (
    coalesce(pol.polname, '') ilike '%venue%photo%'
    or coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%venue-photos%'
    or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%venue-photos%'
    or coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%bucket_id%'
    or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%bucket_id%'
  )
order by pol.polname;

select
  bucket_id,
  name,
  owner,
  owner_id,
  created_at
from storage.objects
where bucket_id = 'venue-photos'
order by created_at desc
limit 10;

-- ------------------------------------------------------------
-- F) Persona intent / expected outcomes (COMMENTS ONLY)
-- ------------------------------------------------------------
-- Contract:
-- - Anon: redirect to /auth; no data access required for this surface.
-- - Authenticated non-owner: denied with generic UX; do not confirm venue existence.
-- - Owner: allowed.
-- - Admin: allowed.
-- Expected findings:
-- - No anon/PUBLIC EXECUTE on owner/admin mutation RPCs.
-- - Auth non-owner denied by RPC/RLS; deny UX is generic (anti-enumeration).
-- - Storage: anon should not list/upload/manage venue-photos unless explicitly intended.
