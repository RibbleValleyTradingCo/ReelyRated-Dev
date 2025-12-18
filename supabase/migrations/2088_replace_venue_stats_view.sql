-- 2088_replace_venue_stats_view.sql
-- Recreate venue_stats to respect published venues and public/visible catches only.

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
  b.headline_pb_weight,
  b.headline_pb_unit,
  b.headline_pb_species,
  COALESCE(s.top_species, ARRAY[]::text[]) AS top_species,
  r.avg_rating,
  r.rating_count
FROM base b
LEFT JOIN species s ON s.venue_id = b.venue_id
LEFT JOIN ratings r ON r.venue_id = b.venue_id;
