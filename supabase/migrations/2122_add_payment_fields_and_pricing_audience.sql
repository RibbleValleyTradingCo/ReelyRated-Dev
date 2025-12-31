-- 2122_add_payment_fields_and_pricing_audience.sql
-- Add payment fields to venues and audience to pricing tiers.

SET search_path = public, extensions;

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS payment_methods text[],
  ADD COLUMN IF NOT EXISTS payment_notes text;

COMMENT ON COLUMN public.venues.payment_methods IS 'Accepted payment methods for the venue (e.g., cash, card, bank_transfer).';
COMMENT ON COLUMN public.venues.payment_notes IS 'Free-form payment notes shown to users (e.g., cash only on bank).';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venue_pricing_audience') THEN
    CREATE TYPE public.venue_pricing_audience AS ENUM ('adult', 'junior', 'oap', 'disabled');
  END IF;
END;
$$;

ALTER TABLE public.venue_pricing_tiers
  ADD COLUMN IF NOT EXISTS audience public.venue_pricing_audience;

COMMENT ON COLUMN public.venue_pricing_tiers.audience IS 'Optional audience category for the pricing tier.';

DROP FUNCTION IF EXISTS public.owner_update_venue_metadata(
  uuid, text, text, text, text[], text[], text, text, text, text
);

CREATE OR REPLACE FUNCTION public.owner_update_venue_metadata(
  p_venue_id uuid,
  p_tagline text,
  p_description text,
  p_ticket_type text,
  p_best_for_tags text[],
  p_facilities text[],
  p_price_from text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text,
  p_payment_methods text[],
  p_payment_notes text
)
returns public.venues
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_allowed boolean;
  v_row public.venues;
begin
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  if not v_allowed then
    raise exception 'Not authorized to update this venue';
  end if;

  update public.venues
  set
    short_tagline = p_tagline,
    description = p_description,
    ticket_type = p_ticket_type,
    best_for_tags = p_best_for_tags,
    facilities = p_facilities,
    price_from = p_price_from,
    website_url = p_website_url,
    booking_url = p_booking_url,
    contact_phone = p_contact_phone,
    payment_methods = p_payment_methods,
    payment_notes = p_payment_notes,
    updated_at = now()
  where id = p_venue_id
  returning * into v_row;

  return v_row;
end;
$$;

GRANT EXECUTE ON FUNCTION public.owner_update_venue_metadata(
  uuid, text, text, text, text[], text[], text, text, text, text, text[], text
) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_update_venue_metadata(
  uuid, text, text, text, text, text[], text[], text, text, text, text
);

CREATE OR REPLACE FUNCTION public.admin_update_venue_metadata(
  p_venue_id uuid,
  p_short_tagline text,
  p_description text,
  p_ticket_type text,
  p_price_from text,
  p_best_for_tags text[],
  p_facilities text[],
  p_website_url text,
  p_booking_url text,
  p_contact_phone text,
  p_notes_for_rr_team text,
  p_payment_methods text[],
  p_payment_notes text
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

  IF NOT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.venues
  SET
    short_tagline      = p_short_tagline,
    description        = p_description,
    ticket_type        = p_ticket_type,
    price_from         = p_price_from,
    best_for_tags      = p_best_for_tags,
    facilities         = p_facilities,
    website_url        = p_website_url,
    booking_url        = p_booking_url,
    contact_phone      = p_contact_phone,
    notes_for_rr_team  = p_notes_for_rr_team,
    payment_methods    = p_payment_methods,
    payment_notes      = p_payment_notes,
    updated_at         = now()
  WHERE id = p_venue_id;
END;
$$;

COMMENT ON FUNCTION public.admin_update_venue_metadata(
  uuid, text, text, text, text, text[], text[], text, text, text, text, text[], text
) IS
  'Admin-only RPC to update venue metadata fields (short_tagline, description, ticket_type, price, tags, facilities, URLs, contact, notes, payment info). Checks admin_users internally.';
GRANT EXECUTE ON FUNCTION public.admin_update_venue_metadata(
  uuid, text, text, text, text, text[], text[], text, text, text, text, text[], text
) TO authenticated;

DROP FUNCTION IF EXISTS public.owner_create_venue_pricing_tier(
  uuid, text, text, text, int
);
DROP FUNCTION IF EXISTS public.owner_update_venue_pricing_tier(
  uuid, uuid, text, text, text, int
);
DROP FUNCTION IF EXISTS public.admin_create_venue_pricing_tier(
  uuid, text, text, text, int
);
DROP FUNCTION IF EXISTS public.admin_update_venue_pricing_tier(
  uuid, uuid, text, text, text, int
);

CREATE OR REPLACE FUNCTION public.owner_create_venue_pricing_tier(
  p_venue_id uuid,
  p_label text,
  p_price text,
  p_unit text,
  p_audience public.venue_pricing_audience,
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
    audience,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_price,
    p_unit,
    p_audience,
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
  p_audience public.venue_pricing_audience,
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
    audience = p_audience,
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_venue_pricing_tier(
  p_venue_id uuid,
  p_label text,
  p_price text,
  p_unit text,
  p_audience public.venue_pricing_audience,
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
    audience,
    order_index
  )
  VALUES (
    p_venue_id,
    p_label,
    p_price,
    p_unit,
    p_audience,
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
  p_audience public.venue_pricing_audience,
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
    audience = p_audience,
    order_index = COALESCE(p_order_index, 0),
    updated_at = now()
  WHERE id = p_id
    AND venue_id = p_venue_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.owner_create_venue_pricing_tier(uuid, text, text, text, public.venue_pricing_audience, int) IS
  'Owner/Admin: create a pricing tier (audience optional).';
COMMENT ON FUNCTION public.owner_update_venue_pricing_tier(uuid, uuid, text, text, text, public.venue_pricing_audience, int) IS
  'Owner/Admin: update a pricing tier (audience optional).';
COMMENT ON FUNCTION public.admin_create_venue_pricing_tier(uuid, text, text, text, public.venue_pricing_audience, int) IS
  'Admin-only: create a pricing tier (audience optional).';
COMMENT ON FUNCTION public.admin_update_venue_pricing_tier(uuid, uuid, text, text, text, public.venue_pricing_audience, int) IS
  'Admin-only: update a pricing tier (audience optional).';

GRANT EXECUTE ON FUNCTION public.owner_create_venue_pricing_tier(uuid, text, text, text, public.venue_pricing_audience, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_update_venue_pricing_tier(uuid, uuid, text, text, text, public.venue_pricing_audience, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_venue_pricing_tier(uuid, text, text, text, public.venue_pricing_audience, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_venue_pricing_tier(uuid, uuid, text, text, text, public.venue_pricing_audience, int) TO authenticated;

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
  notes_for_rr_team text,
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
    v.website_url,
    v.booking_url,
    v.booking_enabled,
    v.contact_phone,
    v.payment_methods,
    v.payment_notes,
    v.notes_for_rr_team,
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
  WHERE v.slug = p_slug
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_venue_by_slug(text) IS 'Get a single venue by slug with metadata and aggregate stats.';
GRANT EXECUTE ON FUNCTION public.get_venue_by_slug(text) TO authenticated, anon;
