-- 2125_venue_photos_primary.sql
-- Add primary photo support for venue_photos.

SET search_path = public, extensions;

ALTER TABLE public.venue_photos
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS venue_photos_primary_unique
  ON public.venue_photos (venue_id)
  WHERE is_primary;

DROP POLICY IF EXISTS venue_photos_update ON public.venue_photos;
CREATE POLICY venue_photos_update ON public.venue_photos
  FOR UPDATE
  TO authenticated
  USING (public.is_venue_admin_or_owner(venue_id))
  WITH CHECK (public.is_venue_admin_or_owner(venue_id));

GRANT UPDATE ON public.venue_photos TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_set_venue_photo_primary(
  p_photo_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id
  FROM public.venue_photos
  WHERE id = p_photo_id;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Photo not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to update this venue photo';
  END IF;

  UPDATE public.venue_photos
  SET is_primary = false
  WHERE venue_id = v_venue_id;

  UPDATE public.venue_photos
  SET is_primary = true
  WHERE id = p_photo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_venue_photo_primary(
  p_photo_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_venue_id uuid;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT venue_id INTO v_venue_id
  FROM public.venue_photos
  WHERE id = p_photo_id;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Photo not found';
  END IF;

  UPDATE public.venue_photos
  SET is_primary = false
  WHERE venue_id = v_venue_id;

  UPDATE public.venue_photos
  SET is_primary = true
  WHERE id = p_photo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_venue_photos(
  p_venue_id uuid,
  p_limit int DEFAULT 12,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.venue_photos
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.venue_photos
  WHERE venue_id = p_venue_id
  ORDER BY is_primary DESC, created_at DESC
  LIMIT LEAST(COALESCE(p_limit, 50), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

COMMENT ON FUNCTION public.get_venue_photos(uuid, int, int) IS 'Public: list venue photos for a given venue (primary first, then newest).';

GRANT EXECUTE ON FUNCTION public.owner_set_venue_photo_primary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_venue_photo_primary(uuid) TO authenticated;
