SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.catch_rating_stats (
  catch_id uuid PRIMARY KEY REFERENCES public.catches(id) ON DELETE CASCADE,
  rating_sum numeric NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catch_leaderboard_scores (
  catch_id uuid PRIMARY KEY REFERENCES public.catches(id) ON DELETE CASCADE,
  species_key text NULL,
  created_at timestamptz NOT NULL,
  total_score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.catch_rating_stats (catch_id, rating_sum, rating_count, updated_at)
SELECT
  c.id,
  COALESCE(SUM(r.rating), 0)::numeric AS rating_sum,
  COUNT(r.id)::integer AS rating_count,
  now()
FROM public.catches c
LEFT JOIN public.ratings r ON r.catch_id = c.id
GROUP BY c.id
ON CONFLICT (catch_id) DO UPDATE
SET
  rating_sum = EXCLUDED.rating_sum,
  rating_count = EXCLUDED.rating_count,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.catch_leaderboard_scores (catch_id, species_key, created_at, total_score, updated_at)
SELECT
  c.id,
  COALESCE(c.species_slug, c.species) AS species_key,
  c.created_at,
  (CASE
    WHEN COALESCE(crs.rating_count, 0) > 0 THEN (crs.rating_sum / crs.rating_count)
    ELSE 0
  END) * 10 + COALESCE(c.weight, 0) AS total_score,
  now()
FROM public.catches c
LEFT JOIN public.catch_rating_stats crs ON crs.catch_id = c.id
ON CONFLICT (catch_id) DO UPDATE
SET
  species_key = EXCLUDED.species_key,
  created_at = EXCLUDED.created_at,
  total_score = EXCLUDED.total_score,
  updated_at = EXCLUDED.updated_at;

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
    COALESCE(c.species_slug, c.species),
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

CREATE OR REPLACE FUNCTION public.handle_ratings_leaderboard_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_leaderboard_precompute(OLD.catch_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.catch_id IS DISTINCT FROM OLD.catch_id THEN
    PERFORM public.refresh_leaderboard_precompute(OLD.catch_id);
  END IF;

  PERFORM public.refresh_leaderboard_precompute(NEW.catch_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_catches_leaderboard_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM public.refresh_leaderboard_precompute(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ratings_leaderboard_refresh ON public.ratings;
CREATE TRIGGER ratings_leaderboard_refresh
AFTER INSERT OR DELETE OR UPDATE OF rating, catch_id ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.handle_ratings_leaderboard_change();

DROP TRIGGER IF EXISTS catches_leaderboard_refresh ON public.catches;
CREATE TRIGGER catches_leaderboard_refresh
AFTER INSERT OR UPDATE OF weight, species_slug, species, created_at ON public.catches
FOR EACH ROW EXECUTE FUNCTION public.handle_catches_leaderboard_change();

CREATE OR REPLACE VIEW public.leaderboard_scores_detailed AS
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
FROM public.catch_leaderboard_scores cls
JOIN public.catches c ON c.id = cls.catch_id
LEFT JOIN public.profiles p ON p.id = c.user_id
LEFT JOIN public.catch_rating_stats crs ON crs.catch_id = c.id
WHERE c.deleted_at IS NULL
  AND c.visibility = 'public';

GRANT SELECT ON public.leaderboard_scores_detailed TO anon;
GRANT SELECT ON public.leaderboard_scores_detailed TO authenticated;

CREATE INDEX IF NOT EXISTS idx_catch_leaderboard_scores_ordering
ON public.catch_leaderboard_scores (total_score DESC, created_at ASC, catch_id ASC);

CREATE INDEX IF NOT EXISTS idx_catch_leaderboard_scores_species_ordering
ON public.catch_leaderboard_scores (species_key, total_score DESC, created_at ASC, catch_id ASC);

REVOKE ALL ON FUNCTION public.refresh_leaderboard_precompute(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_leaderboard_precompute(uuid) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_ratings_leaderboard_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_ratings_leaderboard_change() FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_catches_leaderboard_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_catches_leaderboard_change() FROM anon, authenticated;
