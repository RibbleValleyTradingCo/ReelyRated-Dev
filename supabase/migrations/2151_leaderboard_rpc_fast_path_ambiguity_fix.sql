SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.get_leaderboard_scores(
  p_species_slug text DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  owner_username text,
  title text,
  species_slug text,
  species text,
  weight numeric,
  weight_unit weight_unit,
  length numeric,
  length_unit length_unit,
  image_url text,
  avg_rating numeric,
  rating_count integer,
  total_score numeric,
  created_at timestamptz,
  location_label text,
  location text,
  method_tag text,
  method text,
  water_type_code text,
  description text,
  gallery_photos text[],
  tags text[],
  video_url text,
  conditions jsonb,
  caught_at timestamptz,
  is_blocked_from_viewer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  p_limit_safe int := GREATEST(COALESCE(p_limit, 100), 1);
  candidate_limit int := LEAST(GREATEST(COALESCE(p_limit, 100), 1) * 5, 1000);
BEGIN
  IF p_species_slug IS NULL THEN
    RETURN QUERY
    WITH candidate_scores AS (
      SELECT cls.catch_id, cls.species_key, cls.total_score, cls.created_at
      FROM public.catch_leaderboard_scores cls
      ORDER BY cls.total_score DESC, cls.created_at ASC, cls.catch_id ASC
      LIMIT candidate_limit
    ),
    expanded AS (
      SELECT
        c.id,
        c.user_id,
        p.username AS owner_username,
        c.title,
        -- __unknown__ is reserved + precompute-only; never emit it to the UI.
        COALESCE(NULLIF(cs.species_key, '__unknown__'), c.species_slug, c.species) AS species_slug,
        c.species,
        c.weight,
        c.weight_unit,
        c.length,
        c.length_unit,
        c.image_url,
        CASE
          WHEN COALESCE(crs.rating_count, 0) > 0
            THEN (COALESCE(crs.rating_sum, 0) / crs.rating_count)
          ELSE 0
        END::numeric AS avg_rating,
        COALESCE(crs.rating_count, 0)::integer AS rating_count,
        COALESCE(cs.total_score, 0) AS total_score,
        COALESCE(cs.created_at, c.created_at) AS created_at,
        COALESCE(c.location_label, c.location) AS location_label,
        c.location,
        COALESCE(c.method_tag, c.method) AS method_tag,
        c.method,
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
      FROM candidate_scores cs
      JOIN public.catches c ON c.id = cs.catch_id
      LEFT JOIN public.profiles p ON p.id = c.user_id
      LEFT JOIN public.catch_rating_stats crs ON crs.catch_id = c.id
      WHERE c.deleted_at IS NULL
        AND c.visibility = 'public'
    )
    SELECT e.*
    FROM expanded e
    WHERE e.is_blocked_from_viewer = false
    ORDER BY e.total_score DESC, e.created_at ASC, e.id ASC
    LIMIT p_limit_safe;
  ELSE
    RETURN QUERY
    WITH candidate_scores AS (
      SELECT cls.catch_id, cls.species_key, cls.total_score, cls.created_at
      FROM public.catch_leaderboard_scores cls
      WHERE cls.species_key = p_species_slug
      ORDER BY cls.total_score DESC, cls.created_at ASC, cls.catch_id ASC
      LIMIT candidate_limit
    ),
    expanded AS (
      SELECT
        c.id,
        c.user_id,
        p.username AS owner_username,
        c.title,
        -- __unknown__ is reserved + precompute-only; never emit it to the UI.
        COALESCE(NULLIF(cs.species_key, '__unknown__'), c.species_slug, c.species) AS species_slug,
        c.species,
        c.weight,
        c.weight_unit,
        c.length,
        c.length_unit,
        c.image_url,
        CASE
          WHEN COALESCE(crs.rating_count, 0) > 0
            THEN (COALESCE(crs.rating_sum, 0) / crs.rating_count)
          ELSE 0
        END::numeric AS avg_rating,
        COALESCE(crs.rating_count, 0)::integer AS rating_count,
        COALESCE(cs.total_score, 0) AS total_score,
        COALESCE(cs.created_at, c.created_at) AS created_at,
        COALESCE(c.location_label, c.location) AS location_label,
        c.location,
        COALESCE(c.method_tag, c.method) AS method_tag,
        c.method,
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
      FROM candidate_scores cs
      JOIN public.catches c ON c.id = cs.catch_id
      LEFT JOIN public.profiles p ON p.id = c.user_id
      LEFT JOIN public.catch_rating_stats crs ON crs.catch_id = c.id
      WHERE c.deleted_at IS NULL
        AND c.visibility = 'public'
    )
    SELECT e.*
    FROM expanded e
    WHERE e.is_blocked_from_viewer = false
    ORDER BY e.total_score DESC, e.created_at ASC, e.id ASC
    LIMIT p_limit_safe;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard_scores(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_scores(text, int) TO anon, authenticated;
