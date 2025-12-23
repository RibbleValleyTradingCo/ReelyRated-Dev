-- 2118_venue_owner_phase1_mvp.sql
-- Phase 1 schema + RPCs + RLS for venue owner admin MVP.

SET search_path = public, extensions;

-- A) venues: booking_enabled toggle
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS booking_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.venues.booking_enabled IS 'Owner-controlled booking toggle for public UI.';

-- B) venue_opening_hours table
CREATE TABLE IF NOT EXISTS public.venue_opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  label text,
  day_of_week smallint NOT NULL,
  opens_at time,
  closes_at time,
  is_closed boolean NOT NULL DEFAULT false,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_opening_hours_day_of_week_check'
  ) THEN
    ALTER TABLE public.venue_opening_hours
      ADD CONSTRAINT venue_opening_hours_day_of_week_check
      CHECK (day_of_week BETWEEN 0 AND 6);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_opening_hours_order_index_check'
  ) THEN
    ALTER TABLE public.venue_opening_hours
      ADD CONSTRAINT venue_opening_hours_order_index_check
      CHECK (order_index >= 0);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_venue_opening_hours_venue_id ON public.venue_opening_hours (venue_id);

ALTER TABLE public.venue_opening_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_venue_opening_hours_set_updated_at') THEN
    CREATE TRIGGER trg_venue_opening_hours_set_updated_at
    BEFORE UPDATE ON public.venue_opening_hours
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_opening_hours' AND policyname = 'venue_opening_hours_select'
  ) THEN
    DROP POLICY venue_opening_hours_select ON public.venue_opening_hours;
  END IF;
  CREATE POLICY venue_opening_hours_select ON public.venue_opening_hours
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
    WHERE schemaname = 'public' AND tablename = 'venue_opening_hours' AND policyname = 'venue_opening_hours_insert'
  ) THEN
    DROP POLICY venue_opening_hours_insert ON public.venue_opening_hours;
  END IF;
  CREATE POLICY venue_opening_hours_insert ON public.venue_opening_hours
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_opening_hours' AND policyname = 'venue_opening_hours_update'
  ) THEN
    DROP POLICY venue_opening_hours_update ON public.venue_opening_hours;
  END IF;
  CREATE POLICY venue_opening_hours_update ON public.venue_opening_hours
    FOR UPDATE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id))
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_opening_hours' AND policyname = 'venue_opening_hours_delete'
  ) THEN
    DROP POLICY venue_opening_hours_delete ON public.venue_opening_hours;
  END IF;
  CREATE POLICY venue_opening_hours_delete ON public.venue_opening_hours
    FOR DELETE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id));
END;
$$;

GRANT SELECT ON public.venue_opening_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.venue_opening_hours TO authenticated;

-- C) venue_pricing_tiers table
CREATE TABLE IF NOT EXISTS public.venue_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  label text NOT NULL,
  price text NOT NULL,
  unit text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_pricing_tiers_order_index_check'
  ) THEN
    ALTER TABLE public.venue_pricing_tiers
      ADD CONSTRAINT venue_pricing_tiers_order_index_check
      CHECK (order_index >= 0);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_venue_pricing_tiers_venue_id ON public.venue_pricing_tiers (venue_id);

ALTER TABLE public.venue_pricing_tiers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_venue_pricing_tiers_set_updated_at') THEN
    CREATE TRIGGER trg_venue_pricing_tiers_set_updated_at
    BEFORE UPDATE ON public.venue_pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_pricing_tiers' AND policyname = 'venue_pricing_tiers_select'
  ) THEN
    DROP POLICY venue_pricing_tiers_select ON public.venue_pricing_tiers;
  END IF;
  CREATE POLICY venue_pricing_tiers_select ON public.venue_pricing_tiers
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
    WHERE schemaname = 'public' AND tablename = 'venue_pricing_tiers' AND policyname = 'venue_pricing_tiers_insert'
  ) THEN
    DROP POLICY venue_pricing_tiers_insert ON public.venue_pricing_tiers;
  END IF;
  CREATE POLICY venue_pricing_tiers_insert ON public.venue_pricing_tiers
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_pricing_tiers' AND policyname = 'venue_pricing_tiers_update'
  ) THEN
    DROP POLICY venue_pricing_tiers_update ON public.venue_pricing_tiers;
  END IF;
  CREATE POLICY venue_pricing_tiers_update ON public.venue_pricing_tiers
    FOR UPDATE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id))
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_pricing_tiers' AND policyname = 'venue_pricing_tiers_delete'
  ) THEN
    DROP POLICY venue_pricing_tiers_delete ON public.venue_pricing_tiers;
  END IF;
  CREATE POLICY venue_pricing_tiers_delete ON public.venue_pricing_tiers
    FOR DELETE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id));
END;
$$;

GRANT SELECT ON public.venue_pricing_tiers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.venue_pricing_tiers TO authenticated;

-- D) venue_rules table
CREATE TABLE IF NOT EXISTS public.venue_rules (
  venue_id uuid PRIMARY KEY REFERENCES public.venues(id) ON DELETE CASCADE,
  rules_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_venue_rules_set_updated_at') THEN
    CREATE TRIGGER trg_venue_rules_set_updated_at
    BEFORE UPDATE ON public.venue_rules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_rules' AND policyname = 'venue_rules_select'
  ) THEN
    DROP POLICY venue_rules_select ON public.venue_rules;
  END IF;
  CREATE POLICY venue_rules_select ON public.venue_rules
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
    WHERE schemaname = 'public' AND tablename = 'venue_rules' AND policyname = 'venue_rules_insert'
  ) THEN
    DROP POLICY venue_rules_insert ON public.venue_rules;
  END IF;
  CREATE POLICY venue_rules_insert ON public.venue_rules
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_rules' AND policyname = 'venue_rules_update'
  ) THEN
    DROP POLICY venue_rules_update ON public.venue_rules;
  END IF;
  CREATE POLICY venue_rules_update ON public.venue_rules
    FOR UPDATE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id))
    WITH CHECK (public.is_venue_admin_or_owner(venue_id));

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'venue_rules' AND policyname = 'venue_rules_delete'
  ) THEN
    DROP POLICY venue_rules_delete ON public.venue_rules;
  END IF;
  CREATE POLICY venue_rules_delete ON public.venue_rules
    FOR DELETE
    TO authenticated
    USING (public.is_venue_admin_or_owner(venue_id));
END;
$$;

GRANT SELECT ON public.venue_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.venue_rules TO authenticated;

-- E) Owner/admin RPCs
CREATE OR REPLACE FUNCTION public.owner_update_venue_booking(
  p_venue_id uuid,
  p_booking_enabled boolean
)
RETURNS public.venues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venues;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to update this venue';
  END IF;

  UPDATE public.venues
  SET
    booking_enabled = COALESCE(p_booking_enabled, booking_enabled),
    updated_at = now()
  WHERE id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_venue_booking(
  p_venue_id uuid,
  p_booking_enabled boolean
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

  UPDATE public.venues
  SET
    booking_enabled = COALESCE(p_booking_enabled, booking_enabled),
    updated_at = now()
  WHERE id = p_venue_id;
END;
$$;

COMMENT ON FUNCTION public.owner_update_venue_booking(uuid, boolean) IS 'Owner/Admin: update venue booking_enabled flag.';
COMMENT ON FUNCTION public.admin_update_venue_booking(uuid, boolean) IS 'Admin-only: update venue booking_enabled flag.';

GRANT EXECUTE ON FUNCTION public.owner_update_venue_booking(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_venue_booking(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_create_venue_opening_hour(
  p_venue_id uuid,
  p_label text,
  p_day_of_week smallint,
  p_opens_at time,
  p_closes_at time,
  p_is_closed boolean DEFAULT false,
  p_order_index int DEFAULT 0
)
RETURNS public.venue_opening_hours
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_opening_hours;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage opening hours for this venue';
  END IF;

  INSERT INTO public.venue_opening_hours (
    venue_id,
    label,
    day_of_week,
    opens_at,
    closes_at,
    is_closed,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_day_of_week,
    p_opens_at,
    p_closes_at,
    COALESCE(p_is_closed, false),
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_update_venue_opening_hour(
  p_id uuid,
  p_venue_id uuid,
  p_label text,
  p_day_of_week smallint,
  p_opens_at time,
  p_closes_at time,
  p_is_closed boolean,
  p_order_index int
)
RETURNS public.venue_opening_hours
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_opening_hours;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage opening hours for this venue';
  END IF;

  UPDATE public.venue_opening_hours
  SET
    label = p_label,
    day_of_week = p_day_of_week,
    opens_at = p_opens_at,
    closes_at = p_closes_at,
    is_closed = COALESCE(p_is_closed, false),
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_delete_venue_opening_hour(
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
  SELECT venue_id INTO v_venue_id FROM public.venue_opening_hours WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Opening hour not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to manage opening hours for this venue';
  END IF;

  DELETE FROM public.venue_opening_hours WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_venue_opening_hour(
  p_venue_id uuid,
  p_label text,
  p_day_of_week smallint,
  p_opens_at time,
  p_closes_at time,
  p_is_closed boolean DEFAULT false,
  p_order_index int DEFAULT 0
)
RETURNS public.venue_opening_hours
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_opening_hours;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_opening_hours (
    venue_id,
    label,
    day_of_week,
    opens_at,
    closes_at,
    is_closed,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_day_of_week,
    p_opens_at,
    p_closes_at,
    COALESCE(p_is_closed, false),
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_venue_opening_hour(
  p_id uuid,
  p_venue_id uuid,
  p_label text,
  p_day_of_week smallint,
  p_opens_at time,
  p_closes_at time,
  p_is_closed boolean,
  p_order_index int
)
RETURNS public.venue_opening_hours
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_opening_hours;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_opening_hours
  SET
    label = p_label,
    day_of_week = p_day_of_week,
    opens_at = p_opens_at,
    closes_at = p_closes_at,
    is_closed = COALESCE(p_is_closed, false),
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_venue_opening_hour(
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

  DELETE FROM public.venue_opening_hours WHERE id = p_id;
END;
$$;

COMMENT ON FUNCTION public.owner_create_venue_opening_hour(uuid, text, smallint, time, time, boolean, int) IS 'Owner/Admin: create an opening-hours row for a venue.';
COMMENT ON FUNCTION public.owner_update_venue_opening_hour(uuid, uuid, text, smallint, time, time, boolean, int) IS 'Owner/Admin: update an opening-hours row for a venue.';
COMMENT ON FUNCTION public.owner_delete_venue_opening_hour(uuid) IS 'Owner/Admin: delete an opening-hours row for a venue.';
COMMENT ON FUNCTION public.admin_create_venue_opening_hour(uuid, text, smallint, time, time, boolean, int) IS 'Admin-only: create an opening-hours row for a venue.';
COMMENT ON FUNCTION public.admin_update_venue_opening_hour(uuid, uuid, text, smallint, time, time, boolean, int) IS 'Admin-only: update an opening-hours row for a venue.';
COMMENT ON FUNCTION public.admin_delete_venue_opening_hour(uuid) IS 'Admin-only: delete an opening-hours row for a venue.';

GRANT EXECUTE ON FUNCTION public.owner_create_venue_opening_hour(uuid, text, smallint, time, time, boolean, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_update_venue_opening_hour(uuid, uuid, text, smallint, time, time, boolean, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_delete_venue_opening_hour(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_venue_opening_hour(uuid, text, smallint, time, time, boolean, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_venue_opening_hour(uuid, uuid, text, smallint, time, time, boolean, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_venue_opening_hour(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_create_venue_pricing_tier(
  p_venue_id uuid,
  p_label text,
  p_price text,
  p_unit text,
  p_order_index int DEFAULT 0
)
RETURNS public.venue_pricing_tiers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_pricing_tiers;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage pricing tiers for this venue';
  END IF;

  INSERT INTO public.venue_pricing_tiers (
    venue_id,
    label,
    price,
    unit,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_price,
    p_unit,
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_update_venue_pricing_tier(
  p_id uuid,
  p_venue_id uuid,
  p_label text,
  p_price text,
  p_unit text,
  p_order_index int
)
RETURNS public.venue_pricing_tiers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_pricing_tiers;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage pricing tiers for this venue';
  END IF;

  UPDATE public.venue_pricing_tiers
  SET
    label = p_label,
    price = p_price,
    unit = p_unit,
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_delete_venue_pricing_tier(
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
  SELECT venue_id INTO v_venue_id FROM public.venue_pricing_tiers WHERE id = p_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Pricing tier not found';
  END IF;

  IF NOT public.is_venue_admin_or_owner(v_venue_id) THEN
    RAISE EXCEPTION 'Not authorized to manage pricing tiers for this venue';
  END IF;

  DELETE FROM public.venue_pricing_tiers WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_venue_pricing_tier(
  p_venue_id uuid,
  p_label text,
  p_price text,
  p_unit text,
  p_order_index int DEFAULT 0
)
RETURNS public.venue_pricing_tiers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_pricing_tiers;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_pricing_tiers (
    venue_id,
    label,
    price,
    unit,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_price,
    p_unit,
    COALESCE(p_order_index, 0)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_venue_pricing_tier(
  p_id uuid,
  p_venue_id uuid,
  p_label text,
  p_price text,
  p_unit text,
  p_order_index int
)
RETURNS public.venue_pricing_tiers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_pricing_tiers;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venue_pricing_tiers
  SET
    label = p_label,
    price = p_price,
    unit = p_unit,
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_venue_pricing_tier(
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

  DELETE FROM public.venue_pricing_tiers WHERE id = p_id;
END;
$$;

COMMENT ON FUNCTION public.owner_create_venue_pricing_tier(uuid, text, text, text, int) IS 'Owner/Admin: create a pricing tier for a venue.';
COMMENT ON FUNCTION public.owner_update_venue_pricing_tier(uuid, uuid, text, text, text, int) IS 'Owner/Admin: update a pricing tier for a venue.';
COMMENT ON FUNCTION public.owner_delete_venue_pricing_tier(uuid) IS 'Owner/Admin: delete a pricing tier for a venue.';
COMMENT ON FUNCTION public.admin_create_venue_pricing_tier(uuid, text, text, text, int) IS 'Admin-only: create a pricing tier for a venue.';
COMMENT ON FUNCTION public.admin_update_venue_pricing_tier(uuid, uuid, text, text, text, int) IS 'Admin-only: update a pricing tier for a venue.';
COMMENT ON FUNCTION public.admin_delete_venue_pricing_tier(uuid) IS 'Admin-only: delete a pricing tier for a venue.';

GRANT EXECUTE ON FUNCTION public.owner_create_venue_pricing_tier(uuid, text, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_update_venue_pricing_tier(uuid, uuid, text, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_delete_venue_pricing_tier(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_venue_pricing_tier(uuid, text, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_venue_pricing_tier(uuid, uuid, text, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_venue_pricing_tier(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_update_venue_rules(
  p_venue_id uuid,
  p_rules_text text
)
RETURNS public.venue_rules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_rules;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to update rules for this venue';
  END IF;

  INSERT INTO public.venue_rules (venue_id, rules_text, created_at, updated_at)
  VALUES (p_venue_id, p_rules_text, now(), now())
  ON CONFLICT (venue_id)
  DO UPDATE SET
    rules_text = EXCLUDED.rules_text,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_venue_rules(
  p_venue_id uuid,
  p_rules_text text
)
RETURNS public.venue_rules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid := auth.uid();
  v_row public.venue_rules;
BEGIN
  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin(v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.venue_rules (venue_id, rules_text, created_at, updated_at)
  VALUES (p_venue_id, p_rules_text, now(), now())
  ON CONFLICT (venue_id)
  DO UPDATE SET
    rules_text = EXCLUDED.rules_text,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.owner_update_venue_rules(uuid, text) IS 'Owner/Admin: upsert venue rules (single text blob).';
COMMENT ON FUNCTION public.admin_update_venue_rules(uuid, text) IS 'Admin-only: upsert venue rules (single text blob).';

GRANT EXECUTE ON FUNCTION public.owner_update_venue_rules(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_venue_rules(uuid, text) TO authenticated;
