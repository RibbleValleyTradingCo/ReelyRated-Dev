SET search_path = public, extensions;

-- Ensure species_key is non-null so equality predicates can use the composite index.
-- '__unknown__' is a reserved sentinel for precompute storage only; never emit as a real species.
UPDATE public.catch_leaderboard_scores
SET species_key = '__unknown__'
WHERE species_key IS NULL;

-- '__unknown__' must remain precompute-only; UI/canonical species should never expose it.
ALTER TABLE public.catch_leaderboard_scores
  ALTER COLUMN species_key SET DEFAULT '__unknown__';

ALTER TABLE public.catch_leaderboard_scores
  ALTER COLUMN species_key SET NOT NULL;

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_precompute(p_catch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_rating_sum numeric;
  v_rating_count int;
  v_weight numeric;
  v_species_key text;
  v_created_at timestamptz;
BEGIN
  -- Serialize per-catch refresh to prevent concurrent rating updates from clobbering stats.
  PERFORM pg_advisory_xact_lock(hashtext(p_catch_id::text));

  SELECT
    c.weight,
    -- Use reserved sentinel for missing species; mapped back via NULLIF in the view.
    COALESCE(c.species_slug, c.species, '__unknown__'),
    c.created_at
  INTO
    v_weight,
    v_species_key,
    v_created_at
  FROM public.catches c
  WHERE c.id = p_catch_id;

  IF NOT FOUND THEN
    DELETE FROM public.catch_rating_stats WHERE catch_id = p_catch_id;
    DELETE FROM public.catch_leaderboard_scores WHERE catch_id = p_catch_id;
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(r.rating), 0)::numeric,
    COUNT(r.id)::integer
  INTO
    v_rating_sum,
    v_rating_count
  FROM public.ratings r
  WHERE r.catch_id = p_catch_id;

  INSERT INTO public.catch_rating_stats (catch_id, rating_sum, rating_count, updated_at)
  VALUES (p_catch_id, v_rating_sum, v_rating_count, now())
  ON CONFLICT (catch_id) DO UPDATE
  SET
    rating_sum = EXCLUDED.rating_sum,
    rating_count = EXCLUDED.rating_count,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.catch_leaderboard_scores (catch_id, species_key, created_at, total_score, updated_at)
  VALUES (
    p_catch_id,
    v_species_key,
    v_created_at,
    (CASE
      WHEN v_rating_count > 0 THEN (v_rating_sum / v_rating_count)
      ELSE 0
    END) * 10 + COALESCE(v_weight, 0),
    now()
  )
  ON CONFLICT (catch_id) DO UPDATE
  SET
    species_key = EXCLUDED.species_key,
    created_at = EXCLUDED.created_at,
    total_score = EXCLUDED.total_score,
    updated_at = EXCLUDED.updated_at;
END;
$$;

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
    WHERE cls.species_key = s.species_key
    ORDER BY cls.total_score DESC, cls.created_at ASC, cls.catch_id ASC
    LIMIT 100
  ) cls ON true
)
SELECT
  c.id,
  c.user_id,
  p.username AS owner_username,
  c.title,
  COALESCE(NULLIF(cls.species_key, '__unknown__'), c.species_slug, c.species) AS species_slug,
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

REVOKE ALL ON FUNCTION public.refresh_leaderboard_precompute(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_leaderboard_precompute(uuid) FROM anon, authenticated;
