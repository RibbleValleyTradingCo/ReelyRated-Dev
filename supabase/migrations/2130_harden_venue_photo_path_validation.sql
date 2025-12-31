-- 2130_harden_venue_photo_path_validation.sql
-- Harden venue photo add RPCs with path validation (bucket + venue folder).

CREATE OR REPLACE FUNCTION public.owner_add_venue_photo(
  p_venue_id uuid,
  p_image_path text,
  p_caption text DEFAULT NULL
)
RETURNS public.venue_photos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_photos;
  v_actor uuid := auth.uid();
  v_image_path text;
  v_expected_prefix text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_image_path := ltrim(trim(coalesce(p_image_path, '')), '/');
  IF v_image_path = '' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  IF position('..' in v_image_path) > 0 THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  v_expected_prefix := 'venue-photos/' || p_venue_id::text || '/';
  IF v_image_path NOT LIKE v_expected_prefix || '%' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;

  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to add photos for this venue';
  END IF;

  INSERT INTO public.venue_photos (venue_id, image_path, caption, created_by)
  VALUES (p_venue_id, v_image_path, p_caption, v_actor)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_venue_photo(
  p_venue_id uuid,
  p_image_path text,
  p_caption text DEFAULT NULL
)
RETURNS public.venue_photos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
  v_row public.venue_photos;
  v_image_path text;
  v_expected_prefix text;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_image_path := ltrim(trim(coalesce(p_image_path, '')), '/');
  IF v_image_path = '' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  IF position('..' in v_image_path) > 0 THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;
  v_expected_prefix := 'venue-photos/' || p_venue_id::text || '/';
  IF v_image_path NOT LIKE v_expected_prefix || '%' THEN
    RAISE EXCEPTION 'Invalid image path';
  END IF;

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  INSERT INTO public.venue_photos (venue_id, image_path, caption, created_by)
  VALUES (p_venue_id, v_image_path, p_caption, v_admin)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
