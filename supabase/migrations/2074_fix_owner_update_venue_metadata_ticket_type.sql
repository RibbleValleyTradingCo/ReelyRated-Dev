-- Align owner_update_venue_metadata signature with frontend usage (includes p_ticket_type)

create or replace function public.owner_update_venue_metadata(
  p_venue_id uuid,
  p_tagline text,
  p_description text,
  p_ticket_type text,
  p_best_for_tags text[],
  p_facilities text[],
  p_price_from text,
  p_website_url text,
  p_booking_url text,
  p_contact_phone text
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
    updated_at = now()
  where id = p_venue_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.owner_update_venue_metadata(
  uuid, text, text, text, text[], text[], text, text, text, text
) to authenticated;
