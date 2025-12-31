-- 2132_split_get_venue_by_slug_public_admin.sql
-- Purpose: remove internal columns from public get_venue_by_slug and add admin-only variant.

SET search_path = public, extensions;

-- Public-safe RPC (no internal-only columns).
DROP FUNCTION IF EXISTS public.get_venue_by_slug(text);

CREATE FUNCTION public.get_venue_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  location text,
  description text,
  is_published boolean,
  created_at timestamptz,
  updated_at timestamptz,
  short_tagline text,
  ticket_type text,
  price_from text,
  best_for_tags text[],
  facilities text[],
  website_url text,
  booking_url text,
  booking_enabled boolean,
  contact_phone text,
  payment_methods text[],
  payment_notes text,
  total_catches integer,
  recent_catches_30d integer,
  active_anglers_all_time integer,
  active_anglers_30d integer,
  headline_pb_weight numeric,
  headline_pb_unit public.weight_unit,
  headline_pb_species text,
  top_species text[],
  avg_rating numeric,
  rating_count integer
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    v.id,
    v.slug,
    v.name,
    v.location,
    v.description,
    v.is_published,
    v.created_at,
    v.updated_at,
    v.short_tagline,
    v.ticket_type,
    v.price_from,
    v.best_for_tags,
    v.facilities,
    v.website_url,
    v.booking_url,
    v.booking_enabled,
    v.contact_phone,
    v.payment_methods,
    v.payment_notes,
    vs.total_catches,
    vs.recent_catches_30d,
    vs.active_anglers_all_time,
    vs.active_anglers_30d,
    vs.headline_pb_weight,
    vs.headline_pb_unit::public.weight_unit,
    vs.headline_pb_species,
    vs.top_species,
    vs.avg_rating,
    vs.rating_count
  FROM public.venues v
  LEFT JOIN public.venue_stats vs ON vs.venue_id = v.id
  WHERE v.slug = p_slug
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_venue_by_slug(text)
IS 'Public-safe: get a single venue by slug with metadata and aggregate stats.';

REVOKE ALL ON FUNCTION public.get_venue_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_venue_by_slug(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_venue_by_slug(text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_venue_by_slug(text) TO anon, authenticated;

-- Admin-only RPC (includes internal notes).
CREATE OR REPLACE FUNCTION public.admin_get_venue_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  location text,
  description text,
  is_published boolean,
  created_at timestamptz,
  updated_at timestamptz,
  short_tagline text,
  ticket_type text,
  price_from text,
  best_for_tags text[],
  facilities text[],
  website_url text,
  booking_url text,
  booking_enabled boolean,
  contact_phone text,
  payment_methods text[],
  payment_notes text,
  notes_for_rr_team text,
  total_catches integer,
  recent_catches_30d integer,
  active_anglers_all_time integer,
  active_anglers_30d integer,
  headline_pb_weight numeric,
  headline_pb_unit public.weight_unit,
  headline_pb_species text,
  top_species text[],
  avg_rating numeric,
  rating_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Not authenticated';
  END IF;

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.slug,
    v.name,
    v.location,
    v.description,
    v.is_published,
    v.created_at,
    v.updated_at,
    v.short_tagline,
    v.ticket_type,
    v.price_from,
    v.best_for_tags,
    v.facilities,
    v.website_url,
    v.booking_url,
    v.booking_enabled,
    v.contact_phone,
    v.payment_methods,
    v.payment_notes,
    v.notes_for_rr_team,
    vs.total_catches,
    vs.recent_catches_30d,
    vs.active_anglers_all_time,
    vs.active_anglers_30d,
    vs.headline_pb_weight,
    vs.headline_pb_unit::public.weight_unit,
    vs.headline_pb_species,
    vs.top_species,
    vs.avg_rating,
    vs.rating_count
  FROM public.venues v
  LEFT JOIN public.venue_stats vs ON vs.venue_id = v.id
  WHERE v.slug = p_slug
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.admin_get_venue_by_slug(text)
IS 'Admin-only: get a venue by slug including internal notes.';

REVOKE ALL ON FUNCTION public.admin_get_venue_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_venue_by_slug(text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_get_venue_by_slug(text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_venue_by_slug(text) TO authenticated;

-- Rollback plan (manual):
-- 1) DROP FUNCTION public.admin_get_venue_by_slug(text);
-- 2) Recreate public.get_venue_by_slug(text) including notes_for_rr_team in the return shape.
-- 3) Reapply grants for public.get_venue_by_slug (anon, authenticated).
--
-- Verify grants (post-migration):
-- SELECT has_function_privilege('anon', 'public.get_venue_by_slug(text)', 'execute') AS anon_can_exec_public;
-- SELECT has_function_privilege('authenticated', 'public.get_venue_by_slug(text)', 'execute') AS auth_can_exec_public;
-- SELECT has_function_privilege('anon', 'public.admin_get_venue_by_slug(text)', 'execute') AS anon_can_exec_admin;
-- SELECT has_function_privilege('authenticated', 'public.admin_get_venue_by_slug(text)', 'execute') AS auth_can_exec_admin;
--
-- Verify security mode + search_path:
-- SELECT proname, prosecdef, pg_get_functiondef(p.oid)
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname IN ('get_venue_by_slug', 'admin_get_venue_by_slug');
--
-- Verify error codes:
-- - Calling admin_get_venue_by_slug as non-admin should raise SQLSTATE 42501.
-- - Calling admin_get_venue_by_slug unauthenticated should raise SQLSTATE 28000.
