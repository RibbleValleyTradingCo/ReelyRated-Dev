-- 2152_owner_get_venue_by_slug.sql
-- Purpose: owner/admin-only venue read for /my/venues/:slug to prevent public data leakage.

DROP FUNCTION IF EXISTS public.owner_get_venue_by_slug(text);

CREATE FUNCTION public.owner_get_venue_by_slug(
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
SECURITY DEFINER
SET search_path = ''
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
    AND auth.uid() IS NOT NULL
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.venue_owners vo
        WHERE vo.venue_id = v.id
          AND vo.user_id = auth.uid()
      )
    )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.owner_get_venue_by_slug(text)
IS 'Owner/admin-only: get a single venue by slug with metadata and aggregate stats.';

REVOKE ALL ON FUNCTION public.owner_get_venue_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owner_get_venue_by_slug(text) FROM anon;
REVOKE ALL ON FUNCTION public.owner_get_venue_by_slug(text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.owner_get_venue_by_slug(text) TO authenticated;
