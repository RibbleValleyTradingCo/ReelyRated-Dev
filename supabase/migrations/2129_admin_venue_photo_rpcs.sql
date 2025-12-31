-- 2129_admin_venue_photo_rpcs.sql
-- Add admin-only venue photo add/delete RPCs (owner RPCs remain unchanged).

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
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  INSERT INTO public.venue_photos (venue_id, image_path, caption, created_by)
  VALUES (p_venue_id, p_image_path, p_caption, v_admin)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_venue_photo(
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT public.is_admin(v_admin) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  DELETE FROM public.venue_photos WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_venue_photo(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_venue_photo(uuid) TO authenticated;
