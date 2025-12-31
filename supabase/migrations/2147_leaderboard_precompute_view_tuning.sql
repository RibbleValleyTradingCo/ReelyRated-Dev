SET search_path = public, extensions;

CREATE OR REPLACE VIEW public.leaderboard_scores_detailed AS
WITH species_list AS (
  SELECT DISTINCT cls.species_key
  FROM public.catch_leaderboard_scores cls
),
top_scores AS (
  SELECT cls.*
  FROM species_list s
  JOIN LATERAL (
    SELECT cls.*
    FROM public.catch_leaderboard_scores cls
    WHERE cls.species_key IS NOT DISTINCT FROM s.species_key
    ORDER BY cls.total_score DESC, cls.created_at ASC, cls.catch_id ASC
    LIMIT 100
  ) cls ON true
)
SELECT
  c.id,
  c.user_id,
  p.username AS owner_username,
  c.title,
  COALESCE(cls.species_key, c.species_slug, c.species) AS species_slug,
  c.species AS species,
  c.weight,
  c.weight_unit,
  c.length,
  c.length_unit,
  c.image_url,
  CASE
    WHEN COALESCE(crs.rating_count, 0) > 0 THEN (COALESCE(crs.rating_sum, 0) / crs.rating_count)
    ELSE 0
  END::numeric AS avg_rating,
  COALESCE(crs.rating_count, 0)::integer AS rating_count,
  COALESCE(cls.total_score, 0) AS total_score,
  COALESCE(cls.created_at, c.created_at) AS created_at,
  COALESCE(c.location_label, c.location) AS location_label,
  c.location AS location,
  COALESCE(c.method_tag, c.method) AS method_tag,
  c.method AS method,
  c.water_type_code,
  c.description,
  c.gallery_photos,
  c.tags,
  c.video_url,
  c.conditions,
  c.caught_at,
  CASE
    WHEN public.is_admin(auth.uid()) THEN false
    WHEN auth.uid() IS NULL THEN false
    ELSE public.is_blocked_either_way(c.user_id, auth.uid())
  END AS is_blocked_from_viewer
FROM top_scores cls
JOIN public.catches c ON c.id = cls.catch_id
LEFT JOIN public.profiles p ON p.id = c.user_id
LEFT JOIN public.catch_rating_stats crs ON crs.catch_id = c.id
WHERE c.deleted_at IS NULL
  AND c.visibility = 'public';

GRANT SELECT ON public.leaderboard_scores_detailed TO anon;
GRANT SELECT ON public.leaderboard_scores_detailed TO authenticated;
