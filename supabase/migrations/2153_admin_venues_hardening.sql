-- 2153_admin_venues_hardening.sql
-- Harden admin venues listing + admin roster exposure + admin notifications.
-- Also contain public venue_stats exposure for anon via a public-safe stats view.

SET search_path = public, extensions;

-- ------------------------------------------------------------------
-- 1) Admin-only venues list RPC
-- ------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_get_venues(text, int, int);

CREATE FUNCTION public.admin_get_venues(
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
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
  total_catches integer,
  recent_catches_30d integer,
  headline_pb_weight numeric,
  headline_pb_unit public.weight_unit,
  headline_pb_species text,
  top_species text[],
  avg_rating numeric,
  rating_count integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Not authenticated';
  END IF;

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Admin privileges required';
  END IF;

  RETURN QUERY
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
    vs.total_catches,
    vs.recent_catches_30d,
    vs.headline_pb_weight,
    vs.headline_pb_unit::public.weight_unit,
    vs.headline_pb_species,
    vs.top_species,
    vs.avg_rating,
    vs.rating_count
  FROM public.venues v
  LEFT JOIN public.venue_stats vs ON vs.venue_id = v.id
  WHERE (p_search IS NULL OR v.name ILIKE '%' || p_search || '%' OR v.location ILIKE '%' || p_search || '%')
  ORDER BY v.name ASC
  LIMIT LEAST(COALESCE(p_limit, 20), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_venues(text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_venues(text, int, int) TO authenticated;

-- ------------------------------------------------------------------
-- 2) Admin badges without admin roster exposure
-- ------------------------------------------------------------------
ALTER TABLE public.catch_comments
  ADD COLUMN IF NOT EXISTS is_admin_author boolean NOT NULL DEFAULT false;

UPDATE public.catch_comments cc
SET is_admin_author = EXISTS (
  SELECT 1 FROM public.admin_users au WHERE au.user_id = cc.user_id
);

CREATE OR REPLACE FUNCTION public.set_comment_admin_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.is_admin_author := public.is_admin(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_comment_admin_author_trigger ON public.catch_comments;
CREATE TRIGGER set_comment_admin_author_trigger
BEFORE INSERT OR UPDATE OF user_id ON public.catch_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_comment_admin_author();

-- Preserve schema/column order and block-filter logic
CREATE OR REPLACE VIEW public.catch_comments_with_admin AS
SELECT
  cc.id,
  cc.catch_id,
  cc.user_id,
  cc.body,
  cc.created_at,
  cc.deleted_at,
  cc.parent_comment_id,
  cc.updated_at,
  cc.is_admin_author
FROM public.catch_comments cc
JOIN public.catches c ON c.id = cc.catch_id
WHERE
  public.is_admin(auth.uid())
  OR (
    NOT public.is_blocked_either_way(auth.uid(), cc.user_id)
    AND NOT public.is_blocked_either_way(auth.uid(), c.user_id)
  );

-- ------------------------------------------------------------------
-- 3) Remove public admin roster access
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS admin_users_select_all ON public.admin_users;

-- ------------------------------------------------------------------
-- 4) Admin notifications without exposing admin_users
-- ------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.notify_admins_for_report(uuid, text, jsonb);

CREATE FUNCTION public.notify_admins_for_report(
  p_report_id uuid,
  p_message text DEFAULT NULL,
  p_extra_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_requester uuid := auth.uid();
  v_report public.reports%ROWTYPE;
  v_message text;
  admin_record record;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  IF v_report.reporter_id <> v_requester THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  v_message := left(COALESCE(NULLIF(trim(p_message), ''), 'A new report was submitted.'), 280);

  FOR admin_record IN
    SELECT user_id FROM public.admin_users WHERE user_id IS NOT NULL
  LOOP
    -- Dedupe: skip if notification for this report already exists for this admin
    IF EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = admin_record.user_id
        AND n.type = 'admin_report'
        AND n.extra_data->>'report_id' = p_report_id::text
    ) THEN
      CONTINUE;
    END IF;

    PERFORM public.create_notification(
      p_user_id   => admin_record.user_id,
      p_actor_id  => v_requester,
      p_type      => 'admin_report',
      p_message   => v_message,
      p_catch_id  => NULL,
      p_comment_id => NULL,
      p_extra_data => jsonb_build_object(
        'report_id', v_report.id,
        'reporter_id', v_report.reporter_id,
        'target_type', v_report.target_type,
        'target_id', v_report.target_id,
        'reason', v_report.reason,
        'details', v_report.details
      ) || COALESCE(p_extra_data, '{}'::jsonb)
    );
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_for_report(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_admins_for_report(uuid, text, jsonb) TO authenticated;

-- ------------------------------------------------------------------
-- 5) Venue stats exposure containment for anon
-- ------------------------------------------------------------------
REVOKE SELECT ON public.venue_stats FROM anon;
GRANT SELECT ON public.venue_stats TO authenticated;

DROP VIEW IF EXISTS public.venue_stats_public;

CREATE VIEW public.venue_stats_public AS
SELECT
  vs.*
FROM public.venue_stats vs
JOIN public.venues v ON v.id = vs.venue_id
WHERE v.is_published = TRUE;

GRANT SELECT ON public.venue_stats_public TO anon, authenticated;

-- Public RPCs use the public-safe stats view
DROP FUNCTION IF EXISTS public.get_venues(text, int, int);

CREATE FUNCTION public.get_venues(
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
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
  total_catches integer,
  recent_catches_30d integer,
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
    vs.total_catches,
    vs.recent_catches_30d,
    vs.headline_pb_weight,
    vs.headline_pb_unit::public.weight_unit,
    vs.headline_pb_species,
    vs.top_species,
    vs.avg_rating,
    vs.rating_count
  FROM public.venues v
  LEFT JOIN public.venue_stats_public vs ON vs.venue_id = v.id
  WHERE (p_search IS NULL OR v.name ILIKE '%' || p_search || '%' OR v.location ILIKE '%' || p_search || '%')
  ORDER BY v.name ASC
  LIMIT LEAST(COALESCE(p_limit, 20), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

COMMENT ON FUNCTION public.get_venues(text, int, int)
IS 'List venues with metadata and aggregate stats for cards.';

REVOKE ALL ON FUNCTION public.get_venues(text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_venues(text, int, int) FROM anon;
REVOKE ALL ON FUNCTION public.get_venues(text, int, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_venues(text, int, int) TO anon, authenticated;

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
  LEFT JOIN public.venue_stats_public vs ON vs.venue_id = v.id
  WHERE v.slug = p_slug
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_venue_by_slug(text)
IS 'Public-safe: get a single venue by slug with metadata and aggregate stats.';

REVOKE ALL ON FUNCTION public.get_venue_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_venue_by_slug(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_venue_by_slug(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_venue_by_slug(text) TO anon, authenticated;
