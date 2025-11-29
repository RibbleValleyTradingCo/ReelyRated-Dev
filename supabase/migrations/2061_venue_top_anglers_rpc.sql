-- 2061_venue_top_anglers_rpc.sql
-- Read-only RPC to list top anglers at a venue, relying on existing RLS/privacy.

SET search_path = public, extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_venue_top_anglers'
      AND n.nspname = 'public'
  ) THEN
    DROP FUNCTION public.get_venue_top_anglers(uuid, int);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_venue_top_anglers(
  p_venue_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_path text,
  avatar_url text,
  catch_count int,
  best_weight numeric,
  best_weight_unit public.weight_unit,
  last_catch_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 10), 50);
BEGIN
  RETURN QUERY
  SELECT
    c.user_id,
    p.username,
    p.avatar_path,
    p.avatar_url,
    COUNT(*)::int AS catch_count,
    MAX(c.weight) FILTER (WHERE c.weight IS NOT NULL) AS best_weight,
    (
      SELECT c2.weight_unit
      FROM public.catches c2
      WHERE c2.venue_id = p_venue_id
        AND c2.user_id = c.user_id
        AND c2.deleted_at IS NULL
        AND c2.weight IS NOT NULL
      ORDER BY c2.weight DESC NULLS LAST, c2.created_at DESC
      LIMIT 1
    ) AS best_weight_unit,
    MAX(c.created_at) AS last_catch_at
  FROM public.catches c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.venue_id = p_venue_id
    AND c.deleted_at IS NULL
  GROUP BY c.user_id, p.username, p.avatar_path, p.avatar_url
  ORDER BY catch_count DESC, best_weight DESC NULLS LAST, last_catch_at DESC
  LIMIT v_limit;
END;
$$;

COMMENT ON FUNCTION public.get_venue_top_anglers(uuid, int) IS 'Top anglers for a venue (count, PB weight) relying on existing RLS/privacy. See docs/VENUE-PAGES-DESIGN.md.';
GRANT EXECUTE ON FUNCTION public.get_venue_top_anglers(uuid, int) TO authenticated;
