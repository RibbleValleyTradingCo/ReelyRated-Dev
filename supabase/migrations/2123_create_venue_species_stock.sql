-- 2121_create_venue_species_stock.sql
-- Add venue species/stock details for Plan Your Visit (Stock & Species).

SET search_path = public, extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venue_stock_density') THEN
    CREATE TYPE public.venue_stock_density AS ENUM ('low', 'medium', 'high');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.venue_species_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  species_name text NOT NULL,
  record_weight numeric NOT NULL,
  record_unit text NOT NULL,
  avg_weight numeric,
  size_range_min numeric,
  size_range_max numeric,
  stock_density public.venue_stock_density NOT NULL,
  stock_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_species_stock_venue_id ON public.venue_species_stock (venue_id);

ALTER TABLE public.venue_species_stock ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_venue_species_stock_set_updated_at') THEN
    CREATE TRIGGER trg_venue_species_stock_set_updated_at
    BEFORE UPDATE ON public.venue_species_stock
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_species_stock' AND policyname = 'venue_species_stock_select'
  ) THEN
    DROP POLICY venue_species_stock_select ON public.venue_species_stock;
  END IF;
  CREATE POLICY venue_species_stock_select ON public.venue_species_stock
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.venues v
        WHERE v.id = venue_id
          AND (v.is_published OR public.is_venue_admin_or_owner(v.id))
      )
    );

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_species_stock' AND policyname = 'venue_species_stock_insert'
  ) THEN
    DROP POLICY venue_species_stock_insert ON public.venue_species_stock;
  END IF;
  CREATE POLICY venue_species_stock_insert ON public.venue_species_stock
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_species_stock' AND policyname = 'venue_species_stock_update'
  ) THEN
    DROP POLICY venue_species_stock_update ON public.venue_species_stock;
  END IF;
  CREATE POLICY venue_species_stock_update ON public.venue_species_stock
    FOR UPDATE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id))
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_species_stock' AND policyname = 'venue_species_stock_delete'
  ) THEN
    DROP POLICY venue_species_stock_delete ON public.venue_species_stock;
  END IF;
  CREATE POLICY venue_species_stock_delete ON public.venue_species_stock
    FOR DELETE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id));
END;
$$;

GRANT SELECT ON public.venue_species_stock TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.venue_species_stock TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_create_venue_species_stock(
  p_venue_id uuid,
  p_species_name text,
  p_record_weight numeric,
  p_record_unit text,
  p_avg_weight numeric,
  p_size_range_min numeric,
  p_size_range_max numeric,
  p_stock_density public.venue_stock_density,
  p_stock_notes text
)
RETURNS public.venue_species_stock
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_species_stock;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage species stock for this venue';
  END IF;

  INSERT INTO public.venue_species_stock (
    venue_id,
    species_name,
    record_weight,
    record_unit,
    avg_weight,
    size_range_min,
    size_range_max,
    stock_density,
    stock_notes
  )
  VALUES (
    p_venue_id,
    p_species_name,
    p_record_weight,
    p_record_unit,
    p_avg_weight,
    p_size_range_min,
    p_size_range_max,
    p_stock_density,
    p_stock_notes
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_update_venue_species_stock(
  p_id uuid,
  p_venue_id uuid,
  p_species_name text,
  p_record_weight numeric,
  p_record_unit text,
  p_avg_weight numeric,
  p_size_range_min numeric,
  p_size_range_max numeric,
  p_stock_density public.venue_stock_density,
  p_stock_notes text
)
RETURNS public.venue_species_stock
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_species_stock;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage species stock for this venue';
  END IF;

  UPDATE public.venue_species_stock
  SET
    species_name = p_species_name,
    record_weight = p_record_weight,
    record_unit = p_record_unit,
    avg_weight = p_avg_weight,
    size_range_min = p_size_range_min,
    size_range_max = p_size_range_max,
    stock_density = p_stock_density,
    stock_notes = p_stock_notes,
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_delete_venue_species_stock(
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id FROM public.venue_species_stock WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Species stock row not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to manage species stock for this venue';
  END IF;

  DELETE FROM public.venue_species_stock WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_venue_species_stock(
  p_venue_id uuid,
  p_species_name text,
  p_record_weight numeric,
  p_record_unit text,
  p_avg_weight numeric,
  p_size_range_min numeric,
  p_size_range_max numeric,
  p_stock_density public.venue_stock_density,
  p_stock_notes text
)
RETURNS public.venue_species_stock
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_species_stock;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_species_stock (
    venue_id,
    species_name,
    record_weight,
    record_unit,
    avg_weight,
    size_range_min,
    size_range_max,
    stock_density,
    stock_notes
  )
  VALUES (
    p_venue_id,
    p_species_name,
    p_record_weight,
    p_record_unit,
    p_avg_weight,
    p_size_range_min,
    p_size_range_max,
    p_stock_density,
    p_stock_notes
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_venue_species_stock(
  p_id uuid,
  p_venue_id uuid,
  p_species_name text,
  p_record_weight numeric,
  p_record_unit text,
  p_avg_weight numeric,
  p_size_range_min numeric,
  p_size_range_max numeric,
  p_stock_density public.venue_stock_density,
  p_stock_notes text
)
RETURNS public.venue_species_stock
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_species_stock;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_species_stock
  SET
    species_name = p_species_name,
    record_weight = p_record_weight,
    record_unit = p_record_unit,
    avg_weight = p_avg_weight,
    size_range_min = p_size_range_min,
    size_range_max = p_size_range_max,
    stock_density = p_stock_density,
    stock_notes = p_stock_notes,
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_venue_species_stock(
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.venue_species_stock WHERE id = p_id;
END;
$$;

COMMENT ON FUNCTION public.owner_create_venue_species_stock(uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text)
  IS 'Owner/Admin: create a species stock row for a venue.';
COMMENT ON FUNCTION public.owner_update_venue_species_stock(uuid, uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text)
  IS 'Owner/Admin: update a species stock row for a venue.';
COMMENT ON FUNCTION public.owner_delete_venue_species_stock(uuid)
  IS 'Owner/Admin: delete a species stock row for a venue.';
COMMENT ON FUNCTION public.admin_create_venue_species_stock(uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text)
  IS 'Admin-only: create a species stock row for a venue.';
COMMENT ON FUNCTION public.admin_update_venue_species_stock(uuid, uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text)
  IS 'Admin-only: update a species stock row for a venue.';
COMMENT ON FUNCTION public.admin_delete_venue_species_stock(uuid)
  IS 'Admin-only: delete a species stock row for a venue.';

GRANT EXECUTE ON FUNCTION public.owner_create_venue_species_stock(uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_update_venue_species_stock(uuid, uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_delete_venue_species_stock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_venue_species_stock(uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_venue_species_stock(uuid, uuid, text, numeric, text, numeric, numeric, numeric, public.venue_stock_density, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_venue_species_stock(uuid) TO authenticated;
