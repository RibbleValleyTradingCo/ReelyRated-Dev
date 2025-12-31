-- 2133_fix_owner_event_contact_phone.sql
-- Fix owner event RPCs to avoid referencing non-existent venue_events.contact_phone.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.owner_create_venue_event(
  p_venue_id uuid,
  p_title text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_description text,
  p_ticket_info text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text,
  p_is_published boolean DEFAULT false
)
RETURNS public.venue_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_events;
BEGIN
  v_allowed := public.is_venue_admin_or_owner(p_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage events for this venue';
  END IF;

  INSERT INTO public.venue_events (
    venue_id,
    title,
    event_type,
    starts_at,
    ends_at,
    description,
    ticket_info,
    website_url,
    booking_url,
    is_published,
    created_at,
    updated_at
  )
  VALUES (
    p_venue_id,
    p_title,
    p_event_type,
    p_starts_at,
    p_ends_at,
    p_description,
    p_ticket_info,
    p_website_url,
    p_booking_url,
    COALESCE(p_is_published, false),
    now(),
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.owner_create_venue_event(
  uuid, text, text, timestamptz, timestamptz, text, text, text, text, text, boolean
) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_update_venue_event(
  p_event_id uuid,
  p_title text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_description text,
  p_ticket_info text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text,
  p_is_published boolean DEFAULT false
)
RETURNS public.venue_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_allowed boolean;
  v_row public.venue_events;
  v_venue_id uuid;
BEGIN
  SELECT venue_id INTO v_venue_id FROM public.venue_events WHERE id = p_event_id;
  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  v_allowed := public.is_venue_admin_or_owner(v_venue_id);
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to manage events for this venue';
  END IF;

  UPDATE public.venue_events
  SET
    title = p_title,
    event_type = p_event_type,
    starts_at = p_starts_at,
    ends_at = p_ends_at,
    description = p_description,
    ticket_info = p_ticket_info,
    website_url = p_website_url,
    booking_url = p_booking_url,
    is_published = COALESCE(p_is_published, false),
    updated_at = now()
  WHERE id = p_event_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.owner_update_venue_event(
  uuid, text, text, timestamptz, timestamptz, text, text, text, text, text, boolean
) TO authenticated;
