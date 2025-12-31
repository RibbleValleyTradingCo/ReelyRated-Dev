-- Extend venue_stats with active angler counts and return them via get_venue_by_slug.

SET search_path = public, extensions;

DROP VIEW IF EXISTS public.venue_stats;

CREATE VIEW public.venue_stats AS
WITH published_venues AS (
  SELECT id
  FROM public.venues
  WHERE is_published = TRUE
),
base AS (
  SELECT
    c.venue_id,
    COUNT(*)::int AS total_catches,
    COUNT(*) FILTER (WHERE c.created_at >= (now() - INTERVAL '30 days'))::int AS recent_catches_30d,
    COUNT(DISTINCT c.user_id) FILTER (WHERE c.user_id IS NOT NULL)::int AS active_anglers_all_time,
    COUNT(DISTINCT c.user_id) FILTER (
      WHERE c.user_id IS NOT NULL
        AND c.created_at >= (now() - INTERVAL '30 days')
    )::int AS active_anglers_30d,
    MAX(c.weight) FILTER (WHERE c.weight IS NOT NULL) AS headline_pb_weight,
    (
      SELECT c2.weight_unit
      FROM public.catches c2
      WHERE c2.venue_id = c.venue_id
        AND c2.deleted_at IS NULL
        AND c2.visibility = 'public'
        AND c2.weight IS NOT NULL
      ORDER BY c2.weight DESC NULLS LAST, c2.created_at DESC
      LIMIT 1
    ) AS headline_pb_unit,
    (
      SELECT c3.species
      FROM public.catches c3
      WHERE c3.venue_id = c.venue_id
        AND c3.deleted_at IS NULL
        AND c3.visibility = 'public'
        AND c3.weight IS NOT NULL
      ORDER BY c3.weight DESC NULLS LAST, c3.created_at DESC
      LIMIT 1
    ) AS headline_pb_species
  FROM public.catches c
  WHERE c.venue_id IS NOT NULL
    AND c.deleted_at IS NULL
    AND c.visibility = 'public'
    AND EXISTS (SELECT 1 FROM published_venues pv WHERE pv.id = c.venue_id)
  GROUP BY c.venue_id
),
species AS (
  SELECT
    c.venue_id,
    ARRAY(
      SELECT s.species
      FROM (
        SELECT c2.species, COUNT(*) AS species_count
        FROM public.catches c2
        WHERE c2.venue_id = c.venue_id
          AND c2.deleted_at IS NULL
          AND c2.visibility = 'public'
          AND c2.venue_id IS NOT NULL
          AND c2.species IS NOT NULL
          AND EXISTS (SELECT 1 FROM published_venues pv WHERE pv.id = c2.venue_id)
        GROUP BY c2.species
        ORDER BY species_count DESC, c2.species
        LIMIT 3
      ) s
    ) AS top_species
  FROM public.catches c
  WHERE c.venue_id IS NOT NULL
    AND c.deleted_at IS NULL
    AND c.visibility = 'public'
    AND EXISTS (SELECT 1 FROM published_venues pv WHERE pv.id = c.venue_id)
  GROUP BY c.venue_id
),
ratings AS (
  SELECT
    vr.venue_id,
    avg(vr.rating)::numeric(3,2) AS avg_rating,
    count(*)::int AS rating_count
  FROM public.venue_ratings vr
  WHERE EXISTS (SELECT 1 FROM published_venues pv WHERE pv.id = vr.venue_id)
  GROUP BY vr.venue_id
)
SELECT
  b.venue_id,
  b.total_catches,
  b.recent_catches_30d,
  b.active_anglers_all_time,
  b.active_anglers_30d,
  b.headline_pb_weight,
  b.headline_pb_unit,
  b.headline_pb_species,
  COALESCE(s.top_species, ARRAY[]::text[]) AS top_species,
  r.avg_rating,
  r.rating_count
FROM base b
LEFT JOIN species s ON s.venue_id = b.venue_id
LEFT JOIN ratings r ON r.venue_id = b.venue_id;

COMMENT ON VIEW public.venue_stats IS 'Aggregated venue metrics for cards/heroes (counts, recent activity, PB, top species, ratings, active anglers). Aggregates visible catches with venue_id; per-catch privacy is not exposed here.';

GRANT SELECT ON public.venue_stats TO authenticated, anon;

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
$$;

COMMENT ON FUNCTION public.get_venue_by_slug(text) IS 'Get a single venue by slug with metadata and aggregate stats.';
GRANT EXECUTE ON FUNCTION public.get_venue_by_slug(text) TO authenticated, anon;
