-- 2099_leaderboard_block_flag.sql
-- Add viewer-relative block flag to leaderboard_scores_detailed without changing rankings.

SET search_path = public, extensions;

CREATE OR REPLACE VIEW public.leaderboard_scores_detailed AS
SELECT
  c.id,
  c.user_id,
  p.username AS owner_username,
  c.title,
  COALESCE(c.species_slug, c.species) AS species_slug,
  c.species AS species,
  c.weight,
  c.weight_unit,
  c.length,
  c.length_unit,
  c.image_url,
  COALESCE(AVG(r.rating), 0)::numeric AS avg_rating,
  COUNT(r.id)::integer AS rating_count,
  (COALESCE(AVG(r.rating), 0)::numeric * 10 + COALESCE(c.weight, 0)::numeric) AS total_score,
  c.created_at,
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
FROM public.catches c
LEFT JOIN public.profiles p ON p.id = c.user_id
LEFT JOIN public.ratings r ON r.catch_id = c.id
WHERE c.deleted_at IS NULL
  AND c.visibility = 'public'
GROUP BY
  c.id,
  c.user_id,
  p.username,
  c.title,
  c.species_slug,
  c.species,
  c.weight,
  c.weight_unit,
  c.length,
  c.length_unit,
  c.image_url,
  c.created_at,
  c.location_label,
  c.location,
  c.method_tag,
  c.method,
  c.water_type_code,
  c.description,
  c.gallery_photos,
  c.tags,
  c.video_url,
  c.conditions,
  c.caught_at;

GRANT SELECT ON public.leaderboard_scores_detailed TO anon;
GRANT SELECT ON public.leaderboard_scores_detailed TO authenticated;
