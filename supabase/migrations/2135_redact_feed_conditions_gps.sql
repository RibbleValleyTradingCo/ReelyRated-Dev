-- 2135_redact_feed_conditions_gps.sql
-- Redact gps data from feed conditions when hide_exact_spot = true for non-owners/non-admins.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.get_feed_catches(
  p_limit integer DEFAULT 18,
  p_offset integer DEFAULT 0,
  p_scope text DEFAULT 'all',
  p_sort text DEFAULT 'newest',
  p_species text DEFAULT 'all',
  p_custom_species text DEFAULT NULL,
  p_venue_id uuid DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  image_url text,
  user_id uuid,
  location text,
  species text,
  weight numeric,
  weight_unit public.weight_unit,
  visibility public.visibility_type,
  hide_exact_spot boolean,
  conditions jsonb,
  created_at timestamptz,
  session_id uuid,
  profiles jsonb,
  ratings jsonb,
  comments jsonb,
  reactions jsonb,
  venues jsonb,
  avg_rating numeric,
  rating_count integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 18), 100);
  v_offset int := GREATEST(COALESCE(p_offset, 0), 0);
  v_scope text := COALESCE(NULLIF(p_scope, ''), 'all');
  v_sort text := COALESCE(NULLIF(p_sort, ''), 'newest');
  v_species text := COALESCE(NULLIF(p_species, ''), 'all');
  v_custom_species text := NULLIF(lower(trim(COALESCE(p_custom_species, ''))), '');
  v_viewer_id uuid := auth.uid();
  v_is_admin boolean := COALESCE(public.is_admin(auth.uid()), false);
BEGIN
  IF p_session_id IS NOT NULL THEN
    RETURN QUERY
    WITH base AS (
      SELECT
        c.*,
        rating_summary.avg_rating,
        rating_summary.rating_count
      FROM public.catches c
      LEFT JOIN LATERAL (
        SELECT
          AVG(r.rating)::numeric AS avg_rating,
          COUNT(*)::int AS rating_count
        FROM public.ratings r
        WHERE r.catch_id = c.id
      ) AS rating_summary ON true
      WHERE c.deleted_at IS NULL
        AND c.session_id = p_session_id
        AND (p_venue_id IS NULL OR c.venue_id = p_venue_id)
        AND (
          v_species = 'all'
          OR (v_species = 'other'
              AND c.species = 'other'
              AND (v_custom_species IS NULL
                OR lower(c.conditions->'customFields'->>'species') LIKE v_custom_species || '%'))
          OR (v_species <> 'other' AND v_species <> 'all' AND c.species = v_species)
        )
        AND (
          v_scope <> 'following'
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM public.profile_follows pf
              WHERE pf.follower_id = auth.uid()
                AND pf.following_id = c.user_id
            )
          )
        )
    )
    SELECT
      b.id,
      b.title,
      b.image_url,
      b.user_id,
      b.location,
      b.species,
      b.weight,
      b.weight_unit,
      b.visibility,
      b.hide_exact_spot,
      CASE
        WHEN b.hide_exact_spot
          AND NOT v_is_admin
          AND (v_viewer_id IS NULL OR v_viewer_id <> b.user_id)
          THEN (b.conditions - 'gps')
        ELSE b.conditions
      END AS conditions,
      b.created_at,
      b.session_id,
      (
        SELECT to_jsonb(p_sub.*)
        FROM (
          SELECT p.username, p.avatar_path, p.avatar_url
          FROM public.profiles p
          WHERE p.id = b.user_id
        ) AS p_sub
      ) AS profiles,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('rating', r.rating)), '[]'::jsonb)
        FROM public.ratings r
        WHERE r.catch_id = b.id
      ) AS ratings,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('id', cc.id)), '[]'::jsonb)
        FROM public.catch_comments cc
        WHERE cc.catch_id = b.id AND cc.deleted_at IS NULL
      ) AS comments,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('user_id', cr.user_id)), '[]'::jsonb)
        FROM public.catch_reactions cr
        WHERE cr.catch_id = b.id
      ) AS reactions,
      (
        SELECT to_jsonb(v_sub.*)
        FROM (
          SELECT v.id, v.slug, v.name
          FROM public.venues v
          WHERE v.id = b.venue_id
        ) AS v_sub
      ) AS venues,
      b.avg_rating,
      b.rating_count
    FROM base b
    ORDER BY
      CASE WHEN v_sort = 'highest_rated' THEN b.avg_rating END DESC NULLS LAST,
      CASE WHEN v_sort = 'highest_rated' THEN b.rating_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'heaviest' THEN b.weight END DESC NULLS LAST,
      CASE WHEN v_sort = 'newest' THEN b.created_at END DESC,
      b.created_at DESC,
      b.id DESC;
  ELSE
    RETURN QUERY
    WITH base AS (
      SELECT
        c.*,
        rating_summary.avg_rating,
        rating_summary.rating_count
      FROM public.catches c
      LEFT JOIN LATERAL (
        SELECT
          AVG(r.rating)::numeric AS avg_rating,
          COUNT(*)::int AS rating_count
        FROM public.ratings r
        WHERE r.catch_id = c.id
      ) AS rating_summary ON true
      WHERE c.deleted_at IS NULL
        AND (p_venue_id IS NULL OR c.venue_id = p_venue_id)
        AND (p_session_id IS NULL OR c.session_id = p_session_id)
        AND (
          v_species = 'all'
          OR (v_species = 'other'
              AND c.species = 'other'
              AND (v_custom_species IS NULL
                OR lower(c.conditions->'customFields'->>'species') LIKE v_custom_species || '%'))
          OR (v_species <> 'other' AND v_species <> 'all' AND c.species = v_species)
        )
        AND (
          v_scope <> 'following'
          OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM public.profile_follows pf
              WHERE pf.follower_id = auth.uid()
                AND pf.following_id = c.user_id
            )
          )
        )
    )
    SELECT
      b.id,
      b.title,
      b.image_url,
      b.user_id,
      b.location,
      b.species,
      b.weight,
      b.weight_unit,
      b.visibility,
      b.hide_exact_spot,
      CASE
        WHEN b.hide_exact_spot
          AND NOT v_is_admin
          AND (v_viewer_id IS NULL OR v_viewer_id <> b.user_id)
          THEN (b.conditions - 'gps')
        ELSE b.conditions
      END AS conditions,
      b.created_at,
      b.session_id,
      (
        SELECT to_jsonb(p_sub.*)
        FROM (
          SELECT p.username, p.avatar_path, p.avatar_url
          FROM public.profiles p
          WHERE p.id = b.user_id
        ) AS p_sub
      ) AS profiles,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('rating', r.rating)), '[]'::jsonb)
        FROM public.ratings r
        WHERE r.catch_id = b.id
      ) AS ratings,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('id', cc.id)), '[]'::jsonb)
        FROM public.catch_comments cc
        WHERE cc.catch_id = b.id AND cc.deleted_at IS NULL
      ) AS comments,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object('user_id', cr.user_id)), '[]'::jsonb)
        FROM public.catch_reactions cr
        WHERE cr.catch_id = b.id
      ) AS reactions,
      (
        SELECT to_jsonb(v_sub.*)
        FROM (
          SELECT v.id, v.slug, v.name
          FROM public.venues v
          WHERE v.id = b.venue_id
        ) AS v_sub
      ) AS venues,
      b.avg_rating,
      b.rating_count
    FROM base b
    ORDER BY
      CASE WHEN v_sort = 'highest_rated' THEN b.avg_rating END DESC NULLS LAST,
      CASE WHEN v_sort = 'highest_rated' THEN b.rating_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'heaviest' THEN b.weight END DESC NULLS LAST,
      CASE WHEN v_sort = 'newest' THEN b.created_at END DESC,
      b.created_at DESC,
      b.id DESC
    LIMIT v_limit
    OFFSET v_offset;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_feed_catches(integer, integer, text, text, text, text, uuid, uuid) IS
  'Feed catches with server-side scope/species/sort. GPS redacted when hide_exact_spot is true for non-owner/non-admin.';

-- Verify redaction (post-migration):
-- SELECT set_config('request.jwt.claim.sub', '<viewer_uuid>', true);
-- SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- SELECT id, hide_exact_spot, conditions
-- FROM public.get_feed_catches(1, 0, 'all', 'newest', 'all', NULL, NULL, NULL)
-- WHERE hide_exact_spot = true;
-- -- Expect: conditions does NOT include gps for non-owner/non-admin viewers.
--
-- -- Owner check (viewer is catch owner)
-- SELECT set_config('request.jwt.claim.sub', '<owner_uuid>', true);
-- SELECT id, hide_exact_spot, conditions
-- FROM public.get_feed_catches(1, 0, 'all', 'newest', 'all', NULL, NULL, NULL)
-- WHERE hide_exact_spot = true;
-- -- Expect: conditions includes gps for owner.
--
-- -- Admin check
-- SELECT set_config('request.jwt.claim.sub', '<admin_uuid>', true);
-- SELECT id, hide_exact_spot, conditions
-- FROM public.get_feed_catches(1, 0, 'all', 'newest', 'all', NULL, NULL, NULL)
-- WHERE hide_exact_spot = true;
-- -- Expect: conditions includes gps for admin.
